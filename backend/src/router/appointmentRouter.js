const express = require("express");

const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  approveAppointment,
} = require("../controller/appointmentController");

const appointmentRouter = express.Router();

appointmentRouter.post("/", isLoggedIn, bookAppointment);
appointmentRouter.get("/myappointment", isLoggedIn, getMyAppointment);
appointmentRouter.patch("/:id/status", isLoggedIn, updateAppointmentStatus);
appointmentRouter.patch("/:id/approve", isLoggedIn, isAdmin, approveAppointment)

module.exports = appointmentRouter;
