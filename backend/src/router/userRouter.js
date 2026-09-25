const express = require("express");
const { registerUser, getUsers, activateUser } = require("../controller/userController");


const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.get("/", getUsers);
userRouter.post("/activate", activateUser);

module.exports = userRouter;