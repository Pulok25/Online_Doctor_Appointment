const { Schema, model } = require("mongoose");

const slotSchema = new Schema(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "doctor reference is required"],
    },
    date: {
      type: Date,
      required: [true, "date is required"],
    },
    startTime: {
      type: String,
      required: [true, "start time is required"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "end time is required"],
      trim: true,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index for exact duplicate prevention
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });
slotSchema.index({ doctor: 1, isBooked: 1, date: 1 });

module.exports = model("Slot", slotSchema);
