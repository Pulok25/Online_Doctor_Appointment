const { Schema, model } = require("mongoose");

const slotSchema = new Schema(
  {
    doctor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "date is required"],
    },
    startTime: {
      type: String,
      required: [true, "start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "end time is required"],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = model("Slot", slotSchema);
