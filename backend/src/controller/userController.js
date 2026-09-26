const createError = require("http-errors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const createJSONWebToken = require("../helper/jsonwebtoken");
const { jwtActivationKey } = require("../secret");

const getUsers = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const searchRegExp = new RegExp(search, "i");

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
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password || !phone || !address) {
      throw createError(400, "all fields are required");
    }

    const userExists = await User.exists({ email });
    if (userExists) {
      throw createError(
        409,
        "User with this email already exists. Please login"
      );
    }

    const token = createJSONWebToken(
      { name, email, password, phone, address },
      jwtActivationKey,
      "10m"
    );

    console.log("activation token:", token);

    return successResponse(res, {
      statusCode: 201,
      message: "check your email to complete registration",
      payload: { token },
    });
  } catch (error) {
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw createError(400, "token is required");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtActivationKey);
    } catch (error) {
      throw createError(401, "token is invalid or has expired");
    }

    const { name, email, password, phone, address } = decoded;

    const userExists = await User.exists({ email });
    if (userExists) {
      throw createError(
        409,
        "User with this email already exists. Please login"
      );
    }

    const user = await User.create({ name, email, password, phone, address });

    const userWithoutPassword = user.toObject()
    delete userWithoutPassword.password

    return successResponse(res, {
      statusCode: 201,
      message: "user was registered successfully",
      payload: { user: userWithoutPassword },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, registerUser, activateUser };