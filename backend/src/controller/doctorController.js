const createError = require("http-errors");
const DoctorProfile = require("../models/doctorProfileModel");
const { successResponse } = require("./responseController");
const User = require("../models/userModel");

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
      bmdcNumber: normalizedBmdc,
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

const getApplications = async (req, res, next) => {
  try {
    const status = req.query.status || "pending";

    const applications = await DoctorProfile.find({ status }).populate(
      "user",
      "name email phone",
    );

    return successResponse(res, {
      statusCode: 200,
      message: "application fetched successfully",
      payload: { applications },
    });
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      throw createError(404, "application not found");
    }
    if (profile.status !== "pending") {
      throw createError(409, `application already ${profile.status}`);
    }
    await User.findByIdAndUpdate(profile.user, { role: "doctor" });
    profile.status = "approved";
    await profile.save();

    return successResponse(res, {
      statusCode: 200,
      message: "doctor aprroved successfully",
      payload: { profile },
    });
  } catch (error) {
    next(error);
  }
};

const rejectDoctor = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      throw createError(404, "application not found");
    }
    if (profile.status !== "pending") {
      throw createError(409, `application already ${profile.status}`);
    }
    profile.status = "rejected";
    await profile.save();
    return successResponse(res, {
      statusCode: 200,
      message: "doctor application rejected",
      payload: { profile },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForDoctor,
  getApplications,
  approveDoctor,
  rejectDoctor,
};
