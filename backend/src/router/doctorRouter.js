const express = require("express");
const { isLoggedIn } = require("../middlewares/authMiddleware");
const { applyForDoctor } = require("../controller/doctorController");

const doctorRouter = express.Router()

doctorRouter.post("/apply", isLoggedIn, applyForDoctor)

module.exports = doctorRouter
