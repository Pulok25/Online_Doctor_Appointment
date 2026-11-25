const { Schema, model } = require("mongoose");

const messageSchema = new Schema(
  {
    sender: {
      type: String,
      enum: ["patient", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const complaintSchema = new Schema(
  {
    referenceId: {
      type: String,
      unique: true,
      // generated pre-save
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Complaint title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title can be at most 150 characters"],
    },
    category: {
      type: String,
      enum: [
        "billing",
        "doctor_behavior",
        "appointment",
        "service_quality",
        "prescription",
        "technical",
        "other",
      ],
      required: [true, "Category is required"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    description: {
      type: String,
      required: [true, "Complaint description is required"],
      trim: true,
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [3000, "Description can be at most 3000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "in_review", "resolved", "dismissed"],
      default: "pending",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate a unique complaint reference ID before save
complaintSchema.pre("save", async function (next) {
  if (this.referenceId) return next();
  const count = await this.constructor.countDocuments();
  const year = new Date().getFullYear();
  this.referenceId = `CMP-${year}-${String(count + 1).padStart(5, "0")}`;
  next();
});

module.exports = model("Complaint", complaintSchema);
