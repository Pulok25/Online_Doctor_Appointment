const express = require("express");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const { applyForDoctor, getApplications } = require("../controller/doctorController");

const doctorRouter = express.Router()

doctorRouter.post("/apply", isLoggedIn, applyForDoctor)
doctorRouter.get('/applications', isLoggedIn, isAdmin, getApplications )
 

module.exports = doctorRouter
