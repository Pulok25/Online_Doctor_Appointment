const jwt = require("jsonwebtoken");
const createError = require("http-errors");
const { jwtAccessKey } = require("../secret");

const isLoggedIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError(401, "access token is missing");
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, jwtAccessKey);
    } catch (error) {
      throw createError(401, "access token is invalid or has expired");
    }

    req.user = decoded; // { _id, role, iat, exp }
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

module.exports = { isLoggedIn, isAdmin };