const createError = require("http-errors");
const DoctorProfile = require("../models/doctorProfileModel");
const { successResponse } = require("./responseController");
const User = require("../models/userModel");
const Slot = require("../models/slotModel");
const path = require('path');
const { doctorImagePath } = require("../secret");
const fs = require("fs");
const { str, escapeRegex } = require("../helper/validate");

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
      if (req.file) fs.unlink(req.file.path, () => {});
      throw createError(400, "all things are required");
    }

    const alreadyApplied = await DoctorProfile.findOne({ user: req.user._id });
    if (alreadyApplied) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw createError(409, "You have already applied ");
    }

    let normalizedBmdc;
    try {
      normalizedBmdc = str(bmdcNumber, "bmdcNumber", { max: 30 }).toUpperCase();
      str(specialization, "specialization", { max: 100 });
      str(qualification, "qualification", { max: 200 });
      if (bio !== undefined) str(bio, "bio", { min: 0, max: 1000 });
      if (!Number.isFinite(Number(experienceYears)) || !Number.isFinite(Number(fee)) || Number(fee) < 0) {
        throw createError(400, "experienceYears and fee must be numbers");
      }
    } catch (e) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw e;
    }
    const bmdcUsed = await DoctorProfile.exists({ bmdcNumber: normalizedBmdc });
    if (bmdcUsed) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw createError(409, "this BMDC number is already registered");
    }

    const image = req.file ? `${doctorImagePath}/${req.file.filename}` : undefined;

    const profile = await DoctorProfile.create({
      user: req.user._id,
      specialization,
      qualification,
      experienceYears,
      fee,
      bio,
      bmdcNumber: normalizedBmdc,
      image,
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
    if (!["pending", "approved", "rejected"].includes(status)) {
      throw createError(400, "invalid status");
    }

    const applications = await DoctorProfile.find({ status }).populate(
      "user",
      "name email phone isBanned",
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

const removeDoctor = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      throw createError(404, "doctor profile not found");
    }

    // Downgrade user's role to patient
    await User.findByIdAndUpdate(profile.user, { role: "patient" });

    // Mark doctor profile status as rejected
    profile.status = "rejected";
    await profile.save();

    // Remove any unbooked future slots for this doctor
    await Slot.deleteMany({ doctor: profile.user, isBooked: false });

    return successResponse(res, {
      statusCode: 200,
      message: "doctor was successfully removed and downgraded to patient",
      payload: { profile },
    });
  } catch (error) {
    next(error);
  }
};

const toggleBanDoctor = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findById(req.params.id);
    if (!profile) {
      throw createError(404, "doctor profile not found");
    }

    const user = await User.findById(profile.user);
    if (!user) {
      throw createError(404, "associated user account not found");
    }

    user.isBanned = !user.isBanned;
    await user.save();

    if (user.isBanned) {
      // If banned, downgrade doctor profile status and clear unbooked slots
      profile.status = "rejected";
      await profile.save();
      await Slot.deleteMany({ doctor: profile.user, isBooked: false });
    }

    return successResponse(res, {
      statusCode: 200,
      message: user.isBanned
        ? "doctor account has been banned successfully"
        : "doctor account has been unbanned successfully",
      payload: { isBanned: user.isBanned, profile },
    });
  } catch (error) {
    next(error);
  }
};

const getApprovedDoctors = async (req, res, next) => {
  try {
    const { specialization } = req.query;

    const filter = { status: "approved" };
    if (specialization) {
      if (typeof specialization !== "string" || specialization.length > 50) {
        throw createError(400, "invalid specialization");
      }
      filter.specialization = { $regex: escapeRegex(specialization), $options: "i" };
    }

    const doctors = await DoctorProfile.find(filter)
      .select("-bmdcNumber")
      .populate({
        path: "user",
        select: "name email phone isBanned",
        match: { isBanned: false },
      });

    // Exclude any doctor whose user account is banned or deleted
    const activeDoctors = doctors.filter((doc) => doc.user !== null);

    return successResponse(res, {
      statusCode: 200,
      message: "doctors fetched successfully",
      payload: { doctors: activeDoctors },
    });
  } catch (error) {
    next(error);
  }
};

const getMyDoctorProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id }).populate(
      "user",
      "name email phone",
    );
    if (!profile) {
      throw createError(404, "doctor profile not found");
    }
    return successResponse(res, {
      statusCode: 200,
      message: "doctor profile fetched successfully",
      payload: { profile },
    });
  } catch (error) {
    next(error);
  }
};

const updateDoctorPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      throw createError(400, "image file is required");
    }

    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw createError(404, "doctor profile not found");
    }

    // Delete previous custom image if exists
    if (profile.image && fs.existsSync(profile.image)) {
      try {
        fs.unlinkSync(profile.image);
      } catch (e) {
        console.error("Could not delete old doctor image:", e);
      }
    }

    profile.image = `${doctorImagePath}/${req.file.filename}`;
    await profile.save();

    return successResponse(res, {
      statusCode: 200,
      message: "profile photo updated successfully",
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
  removeDoctor,
  toggleBanDoctor,
  getApprovedDoctors,
  getMyDoctorProfile,
  updateDoctorPhoto,
};
