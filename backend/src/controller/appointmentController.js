const CreateError = require("http-errors");

const Slot = require("../models/slotModel");
const { isObjectId } = require("../helper/validate");
const appointmentModel = require("../models/appointmentModel");
const Prescription = require("../models/prescriptionModel");
const DoctorProfile = require("../models/doctorProfileModel");
const User = require("../models/userModel");
const { successResponse } = require("./responseController");
const { startPdf } = require("../helper/pdf");

const clearInvoice = (appointment) => {
  appointment.invoiceNumber = null;
  appointment.invoiceGeneratedAt = null;
  appointment.invoiceAmount = null;
  appointment.paymentStatus = "unpaid";
  appointment.paidAt = null;
  appointment.transactionId = null;
};

const bookAppointment = async (req, res, next) => {
  try {
    const { slotId, reason } = req.body;

    if (req.user?.role !== "patient") {
      throw CreateError(403, "Doctors and admins cannot book appointments. Only patients can book appointments.");
    }

    // Prevent doctor-to-doctor booking: user cannot have a registered doctor profile
    const isDoctorProfile = await DoctorProfile.exists({ user: req.user._id });
    if (isDoctorProfile) {
      throw CreateError(403, "Doctor-to-doctor booking is prohibited. Doctors cannot book appointments with doctors.");
    }

    if (!isObjectId(slotId)) {
      throw CreateError(400, "valid slotId required");
    }
    if (
      reason !== undefined &&
      (typeof reason !== "string" || reason.length > 500)
    ) {
      throw CreateError(400, "reason must be text up to 500 characters");
    }

    // Verify target slot and prevent duplicate active appointments before locking slot
    const targetSlot = await Slot.findById(slotId);
    if (!targetSlot) {
      throw CreateError(404, "slot not found");
    }

    const existingActiveAppointment = await appointmentModel.findOne({
      patient: req.user._id,
      doctor: targetSlot.doctor,
      status: { $in: ["pending", "approved"] },
    });
    if (existingActiveAppointment) {
      throw CreateError(409, "You already have an active appointment with this doctor.");
    }

    if (req.user._id.toString() === targetSlot.doctor.toString()) {
      throw CreateError(400, "Doctors cannot book appointments with themselves");
    }

    
    const slot = await Slot.findOneAndUpdate(
      { _id: slotId, isBooked: false },
      { $set: { isBooked: true } },
      { new: true },
    );

    if (!slot) {
      throw CreateError(409, "this is already booked or does not exist");
    }

    let appointment;
    try {
      appointment = await appointmentModel.create({
        patient: req.user._id,
        doctor: slot.doctor,
        slot: slot._id,
        slotSnapshot: {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        },
        reason,
      });
    } catch (error) {
      
      await Slot.findByIdAndUpdate(slot._id, { $set: { isBooked: false } });
      if (error.code === 11000) {
        throw CreateError(409, "this slot has already been booked");
      }
      throw error;
    }

    return successResponse(res, {
      statusCode: 201,
      message: "appointment booked successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const getMyAppointment = async (req, res, next) => {
  try {
    const filter =
      req.user.role === "doctor"
        ? { doctor: req.user._id }
        : { patient: req.user._id };

    const appointments = await appointmentModel
      .find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime")
      .populate("prescription")
      .sort({ createdAt: -1 });

    const rx = await Prescription.find({
      appointment: { $in: appointments.map((a) => a._id) },
    }).select("appointment");
    const withRx = new Set(rx.map((p) => p.appointment.toString()));

    const result = appointments.map((a) => {
      const obj = a.toObject();
      if (obj.status === "completed" && obj.slotSnapshot?.date) {
        obj.slot = {
          ...(obj.slot || {}),
          _id: obj.slot?._id || obj.slot,
          date: obj.slotSnapshot.date,
          startTime: obj.slotSnapshot.startTime,
          endTime: obj.slotSnapshot.endTime,
        };
      }
      return {
        ...obj,
        hasPrescription: withRx.has(a._id.toString()) || !!a.prescription,
      };
    });

    return successResponse(res, {
      statusCode: 200,
      message: "appointments fetched successfully",
      payload: { appointments: result },
    });
  } catch (error) {
    next(error);
  }
};

const approveAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) throw CreateError(404, "appointment not found");
    if (appointment.status !== "pending") {
      throw CreateError(409, `appointment already ${appointment.status}`);
    }

    const doctorProfile = await DoctorProfile.findOne({
      user: appointment.doctor,
    });
    const fee = doctorProfile?.fee || 500;

    appointment.status = "approved";
    appointment.invoiceGeneratedAt = new Date();
    appointment.invoiceNumber = `INV-${Date.now()}-${appointment._id
      .toString()
      .slice(-6)
      .toUpperCase()}`;
    appointment.invoiceAmount = fee;
    appointment.paymentStatus = "unpaid";
    await appointment.save();

    const updatedAppointment = await appointmentModel
      .findById(appointment._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked");

    return successResponse(res, {
      statusCode: 200,
      message: "appointment approved successfully and invoice generated",
      payload: { appointment: updatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (req.user?.role !== "doctor") {
      throw CreateError(403, "only doctors can update appointment consultation status");
    }

    if (status !== "completed") {
      throw CreateError(400, "doctors can only mark appointments as completed");
    }
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }
    if (appointment.doctor.toString() !== String(req.user._id)) {
      throw CreateError(403, "you can only update your own assigned appointments");
    }
    if (appointment.status === "completed") {
      throw CreateError(409, "appointment already completed");
    }
    if (appointment.status !== "approved") {
      throw CreateError(
        409,
        "appointment must be admin-approved before it can be completed",
      );
    }

    // Preserve historical slot snapshot
    if (!appointment.slotSnapshot?.date && appointment.slot) {
      const slotDoc = await Slot.findById(appointment.slot);
      if (slotDoc) {
        appointment.slotSnapshot = {
          date: slotDoc.date,
          startTime: slotDoc.startTime,
          endTime: slotDoc.endTime,
        };
      }
    }

    appointment.status = "completed";
    await appointment.save();

    const updatedAppointment = await appointmentModel
      .findById(appointment._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked");

    return successResponse(res, {
      statusCode: 200,
      message: "appointment marked as completed successfully",
      payload: { appointment: updatedAppointment },
    });
  } catch (error) {
    next(error);
  }
};

const getAllAppointments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") {
      if (!["pending", "approved", "completed", "cancelled"].includes(status)) {
        throw CreateError(400, "invalid status");
      }
      filter.status = status;
    }

    const appointments = await appointmentModel
      .find(filter)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked")
      .sort({ createdAt: -1 });

    const result = appointments.map((a) => {
      const obj = a.toObject();
      if (obj.status === "completed" && obj.slotSnapshot?.date) {
        obj.slot = {
          ...(obj.slot || {}),
          _id: obj.slot?._id || obj.slot,
          date: obj.slotSnapshot.date,
          startTime: obj.slotSnapshot.startTime,
          endTime: obj.slotSnapshot.endTime,
          isBooked: obj.slot?.isBooked,
        };
      }
      return obj;
    });

    return successResponse(res, {
      statusCode: 200,
      message: "all appointments fetched successfully",
      payload: { appointments: result },
    });
  } catch (error) {
    next(error);
  }
};

const cancelAppointmentByAdmin = async (req, res, next) => {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }
    if (["completed", "cancelled"].includes(appointment.status)) {
      throw CreateError(409, `appointment already ${appointment.status}`);
    }

    appointment.status = "cancelled";
    clearInvoice(appointment);
    await appointment.save();

    if (appointment.slot) {
      await Slot.findByIdAndUpdate(appointment.slot, { isBooked: false });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "appointment cancelled successfully",
      payload: { appointment },
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, startTime, endTime, newSlotId } = req.body;
    if (!newSlotId && (!date || !startTime || !endTime)) {
      throw CreateError(
        400,
        "date, startTime and endTime (or newSlotId) are required to reschedule slot",
      );
    }

    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) {
      throw CreateError(404, "appointment not found");
    }
    if (["completed", "cancelled"].includes(appointment.status)) {
      throw CreateError(409, `cannot reschedule a ${appointment.status} appointment`);
    }

    let updatedSlot;
    const oldSlotId = appointment.slot;

    if (newSlotId) {
      if (!isObjectId(newSlotId)) {
        throw CreateError(400, "invalid newSlotId");
      }
      // Atomically lock target new slot
      const targetSlot = await Slot.findOneAndUpdate(
        { _id: newSlotId, doctor: appointment.doctor, isBooked: false },
        { $set: { isBooked: true } },
        { new: true }
      );
      if (!targetSlot) {
        throw CreateError(409, "target slot is already booked or does not exist for this doctor");
      }

      appointment.slot = targetSlot._id;
      await appointment.save();

      // Atomically release old slot
      if (oldSlotId && oldSlotId.toString() !== targetSlot._id.toString()) {
        await Slot.findByIdAndUpdate(oldSlotId, { $set: { isBooked: false } });
      }
      updatedSlot = targetSlot;
    } else {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        throw CreateError(400, "invalid date format");
      }

      // Check if a slot already exists for this doctor at the requested time
      const existingConflict = await Slot.findOne({
        doctor: appointment.doctor,
        date: parsedDate,
        startTime,
        _id: { $ne: oldSlotId },
      });

      if (existingConflict) {
        if (existingConflict.isBooked) {
          throw CreateError(409, "the doctor already has a booked slot at this date and time");
        }

        // Atomically lock the conflict slot
        const lockedSlot = await Slot.findOneAndUpdate(
          { _id: existingConflict._id, isBooked: false },
          { $set: { isBooked: true } },
          { new: true }
        );
        if (!lockedSlot) {
          throw CreateError(409, "target slot was concurrently booked by another request");
        }

        appointment.slot = lockedSlot._id;
        await appointment.save();

        // Release old slot
        if (oldSlotId) {
          await Slot.findByIdAndUpdate(oldSlotId, { $set: { isBooked: false } });
        }
        updatedSlot = lockedSlot;
      } else {
        // Safely update existing slot time atomically with duplicate key protection
        try {
          updatedSlot = await Slot.findByIdAndUpdate(
            oldSlotId,
            { $set: { date: parsedDate, startTime, endTime } },
            { new: true, runValidators: true }
          );
        } catch (err) {
          if (err.code === 11000) {
            throw CreateError(409, "a slot already exists at this date and time for this doctor");
          }
          throw err;
        }
      }
    }

    const updatedAppointment = await appointmentModel
      .findById(appointment._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked");

    return successResponse(res, {
      statusCode: 200,
      message: "doctor slot and appointment rescheduled successfully",
      payload: { appointment: updatedAppointment, slot: updatedSlot },
    });
  } catch (error) {
    next(error);
  }
};

const payAppointment = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) {
      throw CreateError(400, "invalid appointment id");
    }

    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) throw CreateError(404, "appointment not found");

    if (appointment.status === "completed" && appointment.slotSnapshot?.date) {
      appointment.slot = {
        ...(appointment.slot ? (typeof appointment.slot.toObject === "function" ? appointment.slot.toObject() : appointment.slot) : {}),
        date: appointment.slotSnapshot.date,
        startTime: appointment.slotSnapshot.startTime,
        endTime: appointment.slotSnapshot.endTime,
      };
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      throw CreateError(403, "You can only pay for your own appointments");
    }

    if (appointment.status !== "approved") {
      throw CreateError(
        400,
        `Payment can only be made for approved appointments (current: ${appointment.status})`
      );
    }

    if (appointment.paymentStatus === "paid") {
      throw CreateError(400, "This appointment invoice is already paid");
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (!appointment.invoiceNumber) {
      appointment.invoiceNumber = `INV-${Date.now()}-${appointment._id
        .toString()
        .slice(-6)
        .toUpperCase()}`;
      appointment.invoiceGeneratedAt = new Date();
    }
    if (!appointment.invoiceAmount) {
      const doctorProfile = await DoctorProfile.findOne({
        user: appointment.doctor,
      });
      appointment.invoiceAmount = doctorProfile?.fee || 500;
    }
    appointment.paymentStatus = "paid";
    appointment.paidAt = new Date();
    appointment.transactionId = `TXN-DEMO-${Date.now()}-${randomSuffix}`;
    await appointment.save();

    const updated = await appointmentModel
      .findById(appointment._id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime isBooked")
      .populate("prescription");

    return successResponse(res, {
      statusCode: 200,
      message: "Payment confirmed successfully! Invoice receipt is ready for download.",
      payload: { appointment: updated },
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) throw CreateError(400, "invalid id");

    const appointment = await appointmentModel
      .findById(req.params.id)
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .populate("slot", "date startTime endTime");

    if (!appointment) throw CreateError(404, "appointment not found");

    if (appointment.status === "completed" && appointment.slotSnapshot?.date) {
      appointment.slot = {
        ...(appointment.slot ? (typeof appointment.slot.toObject === "function" ? appointment.slot.toObject() : appointment.slot) : {}),
        date: appointment.slotSnapshot.date,
        startTime: appointment.slotSnapshot.startTime,
        endTime: appointment.slotSnapshot.endTime,
      };
    }

    const patientId = appointment.patient?._id?.toString() || appointment.patient?.toString();
    const doctorId = appointment.doctor?._id?.toString() || appointment.doctor?.toString();
    const isPatient = patientId === req.user._id.toString();
    const isDoctor = doctorId === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isPatient && !isDoctor && !isAdmin) {
      throw CreateError(403, "not authorized to access this invoice");
    }

    // Auto-generate invoice if appointment was approved or paid previously without invoice number
    if (!appointment.invoiceNumber) {
      if (appointment.status !== "pending" || appointment.paymentStatus === "paid") {
        appointment.invoiceNumber = `INV-${Date.now()}-${appointment._id
          .toString()
          .slice(-6)
          .toUpperCase()}`;
        appointment.invoiceGeneratedAt = appointment.invoiceGeneratedAt || new Date();
        if (!appointment.invoiceAmount) {
          const docProf = await DoctorProfile.findOne({
            user: doctorId,
          });
          appointment.invoiceAmount = docProf?.fee || 500;
        }
        await appointment.save();
      } else {
        throw CreateError(409, "invoice not generated yet");
      }
    }

    if (isPatient && appointment.paymentStatus !== "paid") {
      throw CreateError(
        402,
        "Please complete invoice payment before downloading receipt"
      );
    }

    const doctorProfile = await DoctorProfile.findOne({
      user: doctorId,
    });

    const doc = startPdf(res, `Invoice-${appointment.invoiceNumber}.pdf`);

    // Top Header Banner
    doc.rect(40, 40, 515, 70).fill("#0f766e");
    doc
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("DocSheba Medical Center", 55, 52);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#ccfbf1")
      .text("Official Clinical Consultation & Payment Receipt", 55, 78);

    // Status Badge in Header
    const isPaid = appointment.paymentStatus === "paid";
    if (isPaid) {
      doc.roundedRect(415, 54, 125, 26, 6).fill("#ffffff");
      doc
        .fillColor("#047857")
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text("PAID RECEIPT", 415, 62, { width: 125, align: "center" });
    } else {
      doc.roundedRect(415, 54, 125, 26, 6).fill("#fef3c7");
      doc
        .fillColor("#b45309")
        .font("Helvetica-Bold")
        .fontSize(10.5)
        .text("UNPAID INVOICE", 415, 62, { width: 125, align: "center" });
    }

    // Two Metadata Cards
    const metaY = 125;
    // Left Card: Invoice Summary
    doc.roundedRect(40, metaY, 250, 95, 6).fillAndStroke("#f8fafc", "#e2e8f0");
    doc
      .fillColor("#0f766e")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("INVOICE SUMMARY", 52, metaY + 10);
    doc.fillColor("#475569").font("Helvetica").fontSize(8.5);
    doc
      .text("Invoice Number: ", 52, metaY + 28, { continued: true })
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text(appointment.invoiceNumber || "N/A");
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Issue Date: ", 52, metaY + 44, { continued: true })
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text(
        appointment.invoiceGeneratedAt
          ? new Date(appointment.invoiceGeneratedAt).toDateString()
          : "N/A"
      );
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Payment Status: ", 52, metaY + 60, { continued: true })
      .font("Helvetica-Bold")
      .fillColor(isPaid ? "#059669" : "#d97706")
      .text(isPaid ? "PAID (Online Demo)" : "UNPAID");
    if (appointment.transactionId) {
      doc
        .font("Helvetica")
        .fillColor("#475569")
        .text("Transaction ID: ", 52, metaY + 76, { continued: true })
        .font("Helvetica")
        .fillColor("#64748b")
        .text(appointment.transactionId);
    }

    // Right Card: Patient & Clinician Info
    doc.roundedRect(305, metaY, 250, 95, 6).fillAndStroke("#f8fafc", "#e2e8f0");
    doc
      .fillColor("#0f766e")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("PATIENT & CLINICIAN", 317, metaY + 10);
    doc.fillColor("#475569").font("Helvetica").fontSize(8.5);
    doc
      .text("Patient: ", 317, metaY + 28, { continued: true })
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text(appointment.patient?.name || "Patient");
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Contact: ", 317, metaY + 44, { continued: true })
      .font("Helvetica")
      .fillColor("#1e293b")
      .text(
        appointment.patient?.phone || appointment.patient?.email || "N/A"
      );
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Doctor: ", 317, metaY + 60, { continued: true })
      .font("Helvetica-Bold")
      .fillColor("#0f766e")
      .text(`Dr. ${appointment.doctor?.name || "Specialist"}`);
    const slotDateStr = appointment.slot?.date
      ? new Date(appointment.slot.date).toDateString()
      : "Scheduled";
    doc
      .font("Helvetica")
      .fillColor("#475569")
      .text("Schedule: ", 317, metaY + 76, { continued: true })
      .font("Helvetica")
      .fillColor("#1e293b")
      .text(
        `${slotDateStr} (${appointment.slot?.startTime} - ${appointment.slot?.endTime})`
      );

    // Table Header
    const tableY = 235;
    doc.rect(40, tableY, 515, 24).fill("#f1f5f9");
    doc.fillColor("#334155").font("Helvetica-Bold").fontSize(9);
    doc.text("SERVICE / DESCRIPTION", 52, tableY + 7, { width: 230 });
    doc.text("CATEGORY", 290, tableY + 7, { width: 120 });
    doc.text("AMOUNT", 420, tableY + 7, { width: 120, align: "right" });

    // Table Row
    const rowY = tableY + 34;
    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(
        `Clinical Consultation - Dr. ${appointment.doctor?.name}`,
        52,
        rowY,
        { width: 230 }
      );
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Specialization: ${
          doctorProfile?.specialization || "General Medicine"
        }`,
        52,
        rowY + 14
      );
    doc
      .fillColor("#334155")
      .font("Helvetica")
      .fontSize(9)
      .text("Outpatient Visit", 290, rowY + 5, { width: 120 });
    doc
      .fillColor("#0f172a")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text(`BDT ${appointment.invoiceAmount ?? 500}.00`, 420, rowY + 5, {
        width: 120,
        align: "right",
      });

    // Divider
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(40, rowY + 34)
      .lineTo(555, rowY + 34)
      .stroke();

    // Subtotal & VAT
    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9)
      .text("Subtotal:", 310, rowY + 44, { width: 110, align: "right" });
    doc
      .fillColor("#1e293b")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`BDT ${appointment.invoiceAmount ?? 500}.00`, 430, rowY + 44, {
        width: 110,
        align: "right",
      });

    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(9)
      .text("Taxes / VAT (0%):", 310, rowY + 60, { width: 110, align: "right" });
    doc
      .fillColor("#1e293b")
      .font("Helvetica")
      .fontSize(9)
      .text("BDT 0.00", 430, rowY + 60, { width: 110, align: "right" });

    // Total Paid Highlight Box
    const totalBoxY = rowY + 78;
    doc
      .roundedRect(40, totalBoxY, 515, 34, 6)
      .fillAndStroke("#f0fdf4", "#bbf7d0");
    doc
      .fillColor("#065f46")
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("TOTAL AMOUNT PAID:", 55, totalBoxY + 11);
    doc
      .fillColor("#047857")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text(`BDT ${appointment.invoiceAmount ?? 500}.00`, 400, totalBoxY + 9, {
        width: 140,
        align: "right",
      });

    // Verification Box
    const stampY = totalBoxY + 46;
    doc
      .roundedRect(40, stampY, 515, 48, 6)
      .fillAndStroke("#f8fafc", "#cbd5e1");
    doc
      .fillColor("#059669")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("Payment Confirmed & Verified Electronically", 55, stampY + 9);
    doc
      .fillColor("#475569")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "This electronic receipt is officially generated by DocSheba Medical Network upon verified fee payment. Valid for appointment check-in without requiring manual cashier seals.",
        55,
        stampY + 23,
        { width: 485, lineGap: 2 }
      );

    // Instructions
    const noteY = stampY + 60;
    doc
      .fillColor("#334155")
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Patient Guidelines & Instructions:", 42, noteY);
    doc
      .fillColor("#64748b")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "• Please arrive at the clinic 10-15 minutes before your scheduled slot time.",
        42,
        noteY + 15
      );
    doc.text(
      "• Show this receipt or give your registered phone number at the clinic reception.",
      42,
      noteY + 27
    );
    doc.text(
      "• Following consultation, your doctor will issue an e-Prescription downloadable from your patient portal.",
      42,
      noteY + 39
    );

    // Footer
    doc
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .moveTo(40, 780)
      .lineTo(555, 780)
      .stroke();
    doc
      .fillColor("#94a3b8")
      .font("Helvetica")
      .fontSize(8)
      .text(
        "DocSheba Medical Network · Digital Healthcare Services · support@docsheba.com · Automated Billing",
        40,
        790,
        { width: 515, align: "center" }
      );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookAppointment,
  getMyAppointment,
  approveAppointment,
  updateAppointmentStatus,
  getAllAppointments,
  cancelAppointmentByAdmin,
  rescheduleAppointment,
  payAppointment,
  downloadInvoice,
};