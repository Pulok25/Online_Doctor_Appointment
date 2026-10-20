const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    dosage: { type: String, required: true, trim: true, maxlength: 200 }, // e.g. "1+0+1" or "খাবারের ৩০ মিনিট পর ১ চামচ"
    duration: { type: String, required: true, trim: true, maxlength: 200 }, // e.g. "৭ দিন" or "7 days"
  },
  { _id: false },
);

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true, // one prescription per appointment
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    patientAge: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    patientGender: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    diagnosis: { type: String, required: true, trim: true, maxlength: 1000 },
    medicines: {
      type: [medicineSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "at least one medicine is required",
      },
    },
    tests: {
      type: [String],
      default: [],
    },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prescription", prescriptionSchema);
