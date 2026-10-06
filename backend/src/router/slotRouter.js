const express = require("express");
const { isLoggedIn, isDoctor } = require("../middlewares/authMiddleware");
const { createSlot, getDoctorSlots } = require("../controller/slotController");



const slotRouter = express.Router()

slotRouter.post("/", isLoggedIn, isDoctor, createSlot)
slotRouter.get('/doctor/doctorId', getDoctorSlots )
slotRouter.get('/my-slots', isLoggedIn, isDoctor, getDoctorSlots)

module.exports = slotRouter