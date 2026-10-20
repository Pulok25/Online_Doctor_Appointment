const { Schema, model } = require("mongoose");

const appointmentSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled"],
      default: "pending",
    },
    invoiceNumber: {
      type: String,
      default: null,
    },
    invoiceGeneratedAt: {
      type: Date,
      default: null,
    },
    invoiceAmount: {
      type: Number,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    transactionId: {
      type: String,
      default: null,
    },
    prescription: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      default: null,
    },
  },
  { timestamps: true },
);
appointmentSchema.index(
  { slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "approved"] } },
  },
);

module.exports = model("Appointment", appointmentSchema);