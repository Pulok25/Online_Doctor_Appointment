const CreateError = require("http-errors");

const Slot = require("../models/slotModel");
const appointmentModel = require("../models/appointmentModel");
const { successResponse } = require("./responseController");

const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, reason } = req.body;

    if (!slotId) {
      throw CreateError(400, "slotId required");
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
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["confirmed", "completed", "cancelled"];

    if (!allowed.includes(status)) {
      throw CreateError(400, `status must be one of: ${allowed.join(", ")}`);
    }
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "Appoinment not found");
    }
    if (appointment.doctor.toString() !== req.user._id) {
      throw CreateError(403, "you can only update your own appointments");
    }

    appointment.status = status;
    await appointment.save();
    return successResponse(res, {
      statusCode: 200,
      message: "appointments updated successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { bookAppointment, getMyAppointment, updateAppointmentStatus };
