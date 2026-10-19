const CreateError = require("http-errors");

const Slot = require("../models/slotModel");
const { isObjectId } = require("../helper/validate");
const appointmentModel = require("../models/appointmentModel");
const { successResponse } = require("./responseController");

const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, reason } = req.body;

    if (!isObjectId(slotId)) {
      throw CreateError(400, "valid slotId required");
    }
    if (reason !== undefined && (typeof reason !== "string" || reason.length > 500)) {
      throw CreateError(400, "reason must be text up to 500 characters");
    }
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { isBooked: true },
      { new: true },
    );

    if (!slot) {
      throw CreateError(409, "this is already booked or does not exist");
    }
    let appointment;
    try {
      appointment = await appointmentModel.create({
        patient: req.user._id,
        doctor: slot.doctor,
        slot: slot._id,
        reason,
      });
    } catch (error) {
      await Slot.findByIdAndUpdate(slot._id, { isBooked: false });
      throw error;
    }
    return successResponse(res, {
      statusCode: 201,
      message: "appointment booked successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const getMyAppointment = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "doctor"
        ? { doctor: req.user._id }
        : { patient: req.user._id };
    const appointments = await appointmentModel
      .find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime")
      .sort({ createdAt: -1 });
    return successResponse(res, {
      statusCode: 200,
      message: "appointments fetched successfully",
      payload: { appointments },
    });
  } catch (error) {
    next(error);
  }
};
const approveAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }
    if (appointment.status !== "pending") {
      throw CreateError(409, `appointment already ${appointment.status}`);
    }

    appointment.status = "approved";
    await appointment.save();
    return successResponse(res, {
      statusCode: 200,
      message: "appointment approved successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["completed", "cancelled"];

    if (!allowed.includes(status)) {
      throw CreateError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }
    if (appointment.doctor.toString() !== req.user._id) {
      throw CreateError(403, "you can only update your own appointments");
    }
    if (status === "completed" && appointment.status !== "approved") {
      throw CreateError(
        409,
        "appointment must be admin-approved before it can be completed",
      );
    }

    appointment.status = status;
    await appointment.save();
    return successResponse(res, {
      statusCode: 200,
      message: "appointment updated successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const getAllAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      if (!["pending", "approved", "completed", "cancelled"].includes(status)) {
        throw CreateError(400, "invalid status");
      }
      filter.status = status;
    }

    const appointments = await appointmentModel
      .find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked")
      .sort({ createdAt: -1 });

    return successResponse(res, {
      statusCode: 200,
      message: "all appointments fetched successfully",
      payload: { appointments },
    });
  } catch (error) {
    next(error);
  }
};

const cancelAppointmentByAdmin = async (req, res, next) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }

    appointment.status = "cancelled";
    await appointment.save();

    // Free the slot if it exists
    if (appointment.slot) {
      await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "appointment cancelled successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      throw CreateError(400, "date, startTime and endTime are required to reschedule slot");
    }

    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }

    // Update the slot directly
    const updatedSlot = await Slot.findByIdAndUpdate(
      appointment.slot,
      { date, startTime, endTime },
      { new: true }
    );

    const updatedAppointment = await appointmentModel
      .findById(appointment._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked");

    return successResponse(res, {
      statusCode: 200,
      message: "doctor slot and appointment rescheduled successfully",
      payload: { appointment: updatedAppointment, slot: updatedSlot },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getMyAppointment,
  approveAppointment,
  updateAppointmentStatus,
  getAllAppointments,
  cancelAppointmentByAdmin,
  rescheduleAppointment,
};
