const express = require("express");

const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  approveAppointment,
  getAllAppointments,
  cancelAppointmentByAdmin,
  rescheduleAppointment,
} = require("../controller/appointmentController");

const appointmentRouter = express.Router();

appointmentRouter.post("/", isLoggedIn, bookAppointment);
appointmentRouter.get("/myappointment", isLoggedIn, getMyAppointment);
appointmentRouter.get("/", isLoggedIn, isAdmin, getAllAppointments);
appointmentRouter.patch("/:id/status", isLoggedIn, updateAppointmentStatus);
appointmentRouter.patch("/:id/approve", isLoggedIn, isAdmin, approveAppointment);
appointmentRouter.patch("/:id/cancel", isLoggedIn, isAdmin, cancelAppointmentByAdmin);
appointmentRouter.patch("/:id/reschedule", isLoggedIn, isAdmin, rescheduleAppointment);

module.exports = appointmentRouter;
