const express = require("express");
const {
  registerUser,
  getUsers,
  activateUser,
  loginUser,
} = require("../controller/userController");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/", isLoggedIn, isAdmin, getUsers);
userRouter.post("/activate", activateUser);
userRouter.post("/login", loginUser);


module.exports = userRouter;
