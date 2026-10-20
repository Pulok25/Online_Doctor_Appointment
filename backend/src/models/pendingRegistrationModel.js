const { Schema, model } = require("mongoose");

const pendingRegistrationSchema = new Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24-hour native TTL auto-purge
    },
  },
  { timestamps: false }
);

module.exports = model("PendingRegistration", pendingRegistrationSchema);
