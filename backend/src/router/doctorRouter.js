const express = require("express");
const { isLoggedIn, isAdmin, isDoctor } = require("../middlewares/authMiddleware");
const {
  applyForDoctor,
  getApplications,
  approveDoctor,
  rejectDoctor,
  removeDoctor,
  toggleBanDoctor,
  getApprovedDoctors,
  getMyDoctorProfile,
  updateDoctorPhoto,
} = require("../controller/doctorController");
const upload = require("../middlewares/uploadMiddleware");

const doctorRouter = express.Router();

doctorRouter.get("/applications", isLoggedIn, isAdmin, getApplications);
doctorRouter.patch("/:id/approve", isLoggedIn, isAdmin, approveDoctor);
doctorRouter.patch("/:id/reject", isLoggedIn, isAdmin, rejectDoctor);
doctorRouter.patch("/:id/remove", isLoggedIn, isAdmin, removeDoctor);
doctorRouter.patch("/:id/toggle-ban", isLoggedIn, isAdmin, toggleBanDoctor);
doctorRouter.get("/profile/me", isLoggedIn, isDoctor, getMyDoctorProfile);
doctorRouter.patch("/profile/photo", isLoggedIn, isDoctor, upload.single("image"), updateDoctorPhoto);
doctorRouter.get("/", getApprovedDoctors);
doctorRouter.post("/apply", isLoggedIn, upload.single("image"), applyForDoctor);

module.exports = doctorRouter;