const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const PendingRegistration = require("../models/pendingRegistrationModel");
const { successResponse } = require("./responseController");
const createJSONWebToken = require("../helper/jsonwebtoken");
const bcrypt = require("bcrypt");
const { jwtActivationKey, jwtAccessKey, isProd } = require("../secret");
const { str, escapeRegex, intParam } = require("../helper/validate");

// constant-time-ish login: always run a bcrypt compare, even for unknown emails
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const getUsers = async (req, res, next) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.slice(0, 50) : "";
    const page = intParam(req.query.page, 1, { min: 1, max: 100000 });
    const limit = intParam(req.query.limit, 5, { min: 1, max: 50 });

    const searchRegExp = new RegExp(escapeRegex(search), "i");

    const filter = {
      role: { $ne: "admin" },
      ...(search && {
        $or: [
          { name: { $regex: searchRegExp } },
          { email: { $regex: searchRegExp } },
          { phone: { $regex: searchRegExp } },
        ],
      }),
    };

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await User.countDocuments(filter);

    return successResponse(res, {
      statusCode: 200,
      message: "users were returned successfully",
      payload: {
        users,
        pagination: {
          totalUsers: count,
          currentPage: page,
          previousPage: page - 1 > 0 ? page - 1 : null,
          nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
          totalPages: Math.ceil(count / limit),
          limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  let pendingCreated = false;
  let registeredEmail = null;
  try {
    const body = req.body || {};
    const name = str(body.name, "name", { min: 2, max: 50 });
    const email = str(body.email, "email", { max: 254 }).toLowerCase();
    registeredEmail = email;
    const password = str(body.password, "password", { min: 8, max: 72 }); // bcrypt ignores bytes past 72
    const phone = str(body.phone, "phone", { max: 20 });
    const address = str(body.address, "address", { max: 200 });

    const userExists = await User.exists({ email });
    if (userExists) {
      throw createError(
        409,
        "User with this email already exists. Please login"
      );
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate random 256-bit activation token and hash it with SHA-256
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Atomically upsert pending registration by email (auto-purged after 24h by MongoDB TTL index)
    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        tokenHash,
        name,
        email,
        passwordHash,
        phone,
        address,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );
    pendingCreated = true;

    const token = rawToken;

    // TODO: email `token` to the user. Until SMTP exists, only expose it outside production.
    if (isProd) {
      return successResponse(res, {
        statusCode: 201,
        message: "check your email to complete registration",
      });
    }

    return successResponse(res, {
      statusCode: 201,
      message: "check your email to complete registration",
      payload: { token },
    });
  } catch (error) {
    if (pendingCreated && registeredEmail) {
      await PendingRegistration.deleteOne({ email: registeredEmail }).catch(() => {});
    }
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const rawInput = req.params.token || (req.body || {}).token;
    const token = str(rawInput, "token", { max: 2000 });

    // Compute tokenHash from incoming token (handling raw hex tokens and optional JWT backwards-compat)
    let tokenToHash = token;
    if (token.includes(".")) {
      try {
        const decoded = jwt.verify(token, jwtActivationKey, { algorithms: ["HS256"] });
        tokenToHash = decoded.tokenId || decoded.token || token;
      } catch (_) {
        tokenToHash = token;
      }
    }
    const tokenHash = crypto.createHash("sha256").update(tokenToHash).digest("hex");

    const hasReplicaSet = Boolean(
      mongoose.connection.client?.topology?.description?.setName ||
      mongoose.connection.client?.topology?.description?.type === "ReplicaSetWithPrimary"
    );

    if (hasReplicaSet) {
      const session = await mongoose.startSession();
      try {
        let createdUser;
        await session.withTransaction(async () => {
          const pending = await PendingRegistration.findOne({ tokenHash }).session(session);
          if (!pending) {
            throw createError(401, "token is invalid or has expired");
          }

          const userExists = await User.exists({ email: pending.email }).session(session);
          if (userExists) {
            await PendingRegistration.deleteOne({ _id: pending._id }).session(session);
            throw createError(409, "User with this email already exists. Please login");
          }

          const user = new User({
            name: pending.name,
            email: pending.email,
            password: pending.passwordHash,
            phone: pending.phone,
            address: pending.address,
          });
          user.$locals.prehashed = true;
          await user.save({ session });

          await PendingRegistration.deleteOne({ _id: pending._id }).session(session);

          createdUser = user.toObject();
          delete createdUser.password;
        });

        return successResponse(res, {
          statusCode: 201,
          message: "user was registered successfully",
          payload: { user: createdUser },
        });
      } finally {
        await session.endSession();
      }
    }

    // Standalone MongoDB execution (preserves pending registration until user creation succeeds)
    const pending = await PendingRegistration.findOne({ tokenHash });
    if (!pending) {
      throw createError(401, "token is invalid or has expired");
    }

    const userExists = await User.exists({ email: pending.email });
    if (userExists) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      throw createError(409, "User with this email already exists. Please login");
    }

    let user;
    try {
      user = new User({
        name: pending.name,
        email: pending.email,
        password: pending.passwordHash,
        phone: pending.phone,
        address: pending.address,
      });
      user.$locals.prehashed = true; // already bcrypt-hashed at registration
      await user.save();
    } catch (err) {
      if (err.code === 11000) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        throw createError(409, "User with this email already exists. Please login");
      }
      throw err;
    }

    // Consume pending registration document only after user creation succeeds
    await PendingRegistration.deleteOne({ _id: pending._id });

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return successResponse(res, {
      statusCode: 201,
      message: "user was registered successfully",
      payload: { user: userWithoutPassword },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next)=>{
  try {
    const body = req.body || {}
    const email = str(body.email, "email", { max: 254 }).toLowerCase()
    const password = str(body.password, "password", { max: 72 })
    const user = await User.findOne({ email }).select("+password")
    const isPasswordMatched = await bcrypt.compare(password, user ? user.password : DUMMY_HASH)
    if(!user || !isPasswordMatched){
      throw createError(401, "invalid email or password")
    }
    if(user.isBanned){
      throw createError(403, "this account has been banned")
    }
    const accessToken = createJSONWebToken({
      _id: user._id,
      role: user.role
    },
    jwtAccessKey,
    "15m"
  )
  const userWithoutPassword = user.toObject()
  delete userWithoutPassword.password
  return successResponse(res, {
      statusCode: 200,
      message: "user logged in successfully",
      payload: { user: userWithoutPassword, accessToken },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsers, registerUser, activateUser,loginUser };