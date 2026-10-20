const express = require("express");
const createError = require("http-errors");
const { isLoggedIn, isDoctor } = require("../middlewares/authMiddleware");
const {
  createSlot,
  getDoctorSlots,
  updateSlot,
  deleteSlot,
} = require("../controller/slotController");

const slotRouter = express.Router();

// Middleware ensuring only logged-in doctors or admins can mutate slots
const isDoctorOrAdmin = (req, res, next) => {
  if (["doctor", "admin"].includes(req.user?.role)) {
    return next();
  }
  return next(createError(403, "only doctors or admins are authorized to modify slots"));
};

// Route definitions
slotRouter.post("/", isLoggedIn, isDoctor, createSlot);
slotRouter.get("/my-slots", isLoggedIn, isDoctor, getDoctorSlots);
slotRouter.get("/doctor/:doctorId", getDoctorSlots);
slotRouter.patch("/:id", isLoggedIn, isDoctorOrAdmin, updateSlot);
slotRouter.put("/:id", isLoggedIn, isDoctorOrAdmin, updateSlot);
slotRouter.delete("/:id", isLoggedIn, isDoctorOrAdmin, deleteSlot);

module.exports = slotRouter;
