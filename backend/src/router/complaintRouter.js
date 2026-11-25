const express = require("express");
const { isLoggedIn, isAdmin, isPatient } = require("../middlewares/authMiddleware");
const {
  createComplaint,
  getMyComplaints,
  patientReply,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
} = require("../controller/complaintController");

const complaintRouter = express.Router();

// Patient routes
complaintRouter.post("/", isLoggedIn, isPatient, createComplaint);
complaintRouter.get("/my", isLoggedIn, isPatient, getMyComplaints);
complaintRouter.post("/:id/reply", isLoggedIn, isPatient, patientReply);

// Shared: patient (own) or admin
complaintRouter.get("/:id", isLoggedIn, getComplaintById);

// Admin routes
complaintRouter.get("/", isLoggedIn, isAdmin, getAllComplaints);
complaintRouter.patch("/:id", isLoggedIn, isAdmin, updateComplaintStatus);

module.exports = complaintRouter;
