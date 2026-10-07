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

module.exports = { bookAppointment };
