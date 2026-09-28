const { Schema, model } = require("mongoose");

const doctorProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, "specialization is required"],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, "qualification is required"],
      trim: true,
    },
    experienceYears: {
      type: Number,
      required: [true, "experience is required"],
      min: 0,
    },
    fee: {
      type: Number,
      required: [true, "consultation fee is required"],
      min: 0,
    },
    bmdcNumber: {
      type: String,
      required: [true, "BMDC registration number is required"],
      unique:true,
      trim: true,
      uppercase: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const DoctorProfile =  model("DoctorProfile", doctorProfileSchema)

module.exports = DoctorProfile;