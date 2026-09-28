const createError = require("http-errors");
const DoctorProfile = require("../models/doctorProfileModel");
const { successResponse } = require("./responseController");

const applyForDoctor = async (req, res, next) => {
  try {
    const {
      specialization,
      qualification,
      experienceYears,
      fee,
      bio,
      bmdcNumber,
    } = req.body;
    if (
      !specialization ||
      !qualification ||
      !bmdcNumber ||
      experienceYears === undefined ||
      fee === undefined
    ) {
      throw createError(400, "all things are required");
    }

    const alreadyApplied = await DoctorProfile.findOne({ user: req.user._id });
    if (alreadyApplied) {
      throw createError(409, "You have already applied ");
    }

    const normalizedBmdc = bmdcNumber.trim().toUpperCase();
    const bmdcUsed = await DoctorProfile.exists({ bmdcNumber: normalizedBmdc });
    if (bmdcUsed) {
      throw createError(409, "this BMDC number is already registered");
    }

    const profile = await DoctorProfile.create({
      user: req.user._id,
      specialization,
      qualification,
      experienceYears,
      fee,
      bio,
      bmdcNumber,
    });
    return successResponse(res, {
      statusCode: 201,
      message: "doctor application submitted, waiting for admin approval",
      payload: { profile },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyForDoctor };
