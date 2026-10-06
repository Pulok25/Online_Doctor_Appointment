const createError = require('http-errors')
const Slot = require('../models/slotModel');
const { successResponse } = require('./responseController');



const createSlot = async (req, res, next)=>{
    try {
        const { date, startTime, endTime} = req.body
        if(!date || !startTime || !endTime){
            throw createError(400, 'date, startTime and endTime Required')
        }

        const slot = await Slot.create({
            doctor: req.user._id,
            date,
            startTime,
            endTime,
        })
        return successResponse(res, {
      statusCode: 201,
      message: "slot created successfully",
      payload: { slot },
    });
    } catch (error) {
        if (error.code === 11000) {
      return next(createError(409, "this slot already exists"));
    }
    next(error)
        
    }
}
const getDoctorSlots = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.user._id;

    const slots = await Slot.find({ doctor: doctorId, isBooked: false }).sort({
      date: 1,
      startTime: 1,
    });

    return successResponse(res, {
      statusCode: 200,
      message: "slots fetched successfully",
      payload: { slots },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {createSlot, getDoctorSlots}



