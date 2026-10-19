const express = require("express");
const { isLoggedIn, isDoctor } = require("../middlewares/authMiddleware");
const { createSlot, getDoctorSlots, updateSlot } = require("../controller/slotController");

const slotRouter = express.Router();

slotRouter.post("/", isLoggedIn, isDoctor, createSlot);
slotRouter.patch("/:id", isLoggedIn, updateSlot);
slotRouter.get("/doctor/:doctorId", getDoctorSlots);
slotRouter.get("/my-slots", isLoggedIn, isDoctor, getDoctorSlots);

module.exports = slotRouter;