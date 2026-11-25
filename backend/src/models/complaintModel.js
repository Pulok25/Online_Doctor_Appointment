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

// Auto-generate a unique complaint reference ID before save (Mongoose 9 async hook)
complaintSchema.pre("save", async function () {
  if (this.referenceId) return;
  const year = new Date().getFullYear();
  const count = await this.constructor.countDocuments();
  let seq = count + 1;
  let candidate = `CMP-${year}-${String(seq).padStart(5, "0")}`;
  while (await this.constructor.exists({ referenceId: candidate })) {
    seq += 1;
    candidate = `CMP-${year}-${String(seq).padStart(5, "0")}`;
  }
  this.referenceId = candidate;
});

module.exports = model("Complaint", complaintSchema);
