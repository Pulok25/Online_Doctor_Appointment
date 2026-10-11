const express = require("express");
const { isLoggedIn, isAdmin } = require("../middlewares/authMiddleware");
const {
  applyForDoctor,
  getApplications,
  approveDoctor,
  rejectDoctor,
  getApprovedDoctors,
} = require("../controller/doctorController");

const doctorRouter = express.Router();

doctorRouter.post("/apply", isLoggedIn, applyForDoctor);
doctorRouter.get("/applications", isLoggedIn, isAdmin, getApplications);
doctorRouter.patch("/:id/approve", isLoggedIn, isAdmin, approveDoctor);
doctorRouter.patch("/:id/reject", isLoggedIn, isAdmin, rejectDoctor);
doctorRouter.get("/", getApprovedDoctors);

module.exports = doctorRouter;