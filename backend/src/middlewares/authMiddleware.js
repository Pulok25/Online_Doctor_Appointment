const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { jwtAccessKey } = require("../secret");
const User = require("../models/userModel");

const isLoggedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError(401, "access token is missing");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, jwtAccessKey, { algorithms: ["HS256"] });
    } catch (error) {
      throw createError(401, "access token is invalid or has expired");
    }

    const user = await User.findById(decoded._id).select("role isBanned");
    if (!user) {
      throw createError(401, "user no longer exists");
    }
    if (user.isBanned) {
      throw createError(403, "your account has been banned by the administrator");
    }

    // role comes from the DB, not the token, so demotions/bans apply immediately
    req.user = { _id: String(user._id), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
};

const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(createError(403, "you are not authorized as admin"));
  }
  next();
};

const isDoctor = (req, res, next)=>{
  if(req.user?.role !== "doctor"){
    return next(createError(403, "you are not authorized as a doctor"))
  }
  next()
}

module.exports = { isLoggedIn, isAdmin, isDoctor };