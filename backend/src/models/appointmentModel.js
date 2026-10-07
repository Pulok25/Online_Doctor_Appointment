const {Schema, model} = require('mongoose')



const appointmentSchema = new Schema({
    patient:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    doctor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true

    },
    slot: {
      type: Schema.Types.ObjectId,
      ref: "Slot",
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
},
{timestamps: true}
)


module.exports = model("Appointment", appointmentSchema)