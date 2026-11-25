const createError = require("http-errors");
const Complaint = require("../models/complaintModel");
const Appointment = require("../models/appointmentModel");
const { successResponse } = require("./responseController");

// ─── Patient: Submit a new complaint ────────────────────────────────────────
const createComplaint = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    const { title, category, priority, description, appointmentId } = req.body;

    // If linking to an appointment, verify it belongs to this patient
    if (appointmentId) {
      const appt = await Appointment.findById(appointmentId).lean();
      if (!appt) {
        throw createError(404, "Linked appointment not found");
      }
      if (String(appt.patient) !== String(patientId)) {
        throw createError(403, "You can only link your own appointments");
      }
    }

    const complaint = new Complaint({
      patient: patientId,
      appointment: appointmentId || null,
      title,
      category,
      priority: priority || "medium",
      description,
      messages: [],
    });

    await complaint.save();

    return successResponse(res, {
      statusCode: 201,
      message: "Complaint submitted successfully",
      payload: { complaint },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const firstMsg = Object.values(error.errors)[0]?.message || error.message;
      return next(createError(400, firstMsg));
    }
    if (error.name === "CastError") {
      return next(createError(400, "Invalid ID format"));
    }
    next(error);
  }
};

// ─── Patient: Get my complaints ──────────────────────────────────────────────
const getMyComplaints = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    const { status } = req.query;

    const filter = { patient: patientId };
    if (status && status !== "all") filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate("appointment", "slot reason status")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, {
      statusCode: 200,
      message: "Complaints fetched successfully",
      payload: { complaints },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Patient: Reply to a complaint thread ───────────────────────────────────
const patientReply = async (req, res, next) => {
  try {
    const patientId = req.user._id;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      throw createError(400, "Reply text is required");
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) throw createError(404, "Complaint not found");
    if (String(complaint.patient) !== String(patientId)) {
      throw createError(403, "Access denied");
    }
    if (complaint.status === "resolved" || complaint.status === "dismissed") {
      throw createError(400, "Cannot reply to a closed complaint");
    }

    complaint.messages.push({ sender: "patient", text: text.trim() });
    await complaint.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Reply added",
      payload: { messages: complaint.messages },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Get all complaints (with status filter) ──────────────────────────
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (priority && priority !== "all") filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .populate("patient", "name email phone")
      .populate("appointment", "slot reason status")
      .populate("resolvedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, {
      statusCode: 200,
      message: "All complaints fetched",
      payload: { complaints },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Get a single complaint by ID ────────────────────────────────────
const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate("patient", "name email phone")
      .populate("appointment", "slot reason status")
      .populate("resolvedBy", "name");

    if (!complaint) throw createError(404, "Complaint not found");

    // Also allow the owning patient to fetch their complaint
    if (
      req.user.role === "patient" &&
      String(complaint.patient._id) !== String(req.user._id)
    ) {
      throw createError(403, "Access denied");
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Complaint fetched",
      payload: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Update status & add an admin reply ───────────────────────────────
const updateComplaintStatus = async (req, res, next) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { status, text } = req.body;

    const allowedStatuses = ["pending", "in_review", "resolved", "dismissed"];
    if (status && !allowedStatuses.includes(status)) {
      throw createError(400, "Invalid status value");
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) throw createError(404, "Complaint not found");

    if (status) complaint.status = status;

    if (text && text.trim()) {
      complaint.messages.push({ sender: "admin", text: text.trim() });
    }

    if (status === "resolved" || status === "dismissed") {
      complaint.resolvedBy = adminId;
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Complaint updated successfully",
      payload: { complaint },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  patientReply,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
};
