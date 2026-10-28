const express = require("express");

const { isLoggedIn, isAdmin, isDoctor, isPatient } = require("../middlewares/authMiddleware");
const {
  bookAppointment,
  getMyAppointment,
  updateAppointmentStatus,
  approveAppointment,
  getAllAppointments,
  cancelAppointmentByAdmin,
  rescheduleAppointment,
  payAppointment,
  downloadInvoice,
} = require("../controller/appointmentController");

const appointmentRouter = express.Router();

appointmentRouter.post("/", isLoggedIn, isPatient, bookAppointment);
appointmentRouter.get("/myappointment", isLoggedIn, getMyAppointment);
appointmentRouter.get("/", isLoggedIn, isAdmin, getAllAppointments);
appointmentRouter.patch("/:id/status", isLoggedIn, isDoctor, updateAppointmentStatus);
appointmentRouter.patch("/:id/approve", isLoggedIn, isAdmin, approveAppointment);
appointmentRouter.patch("/:id/cancel", isLoggedIn, isAdmin, cancelAppointmentByAdmin);
appointmentRouter.patch("/:id/reschedule", isLoggedIn, isAdmin, rescheduleAppointment);
appointmentRouter.patch("/:id/pay", isLoggedIn, payAppointment);
appointmentRouter.get("/:id/invoice", isLoggedIn, downloadInvoice);

module.exports = appointmentRouter;
