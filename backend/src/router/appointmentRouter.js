const express = require("express");

const { isLoggedIn } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getMyAppointment,
  updateAppointmentStatus,
} = require("../controller/appointmentController");

const appointmentRouter = express.Router();

appointmentRouter.post("/", isLoggedIn, bookAppointment);
appointmentRouter.get("/myappointment", isLoggedIn, getMyAppointment);
appointmentRouter.patch("/:id/status", isLoggedIn, updateAppointmentStatus);

module.exports = appointmentRouter;
