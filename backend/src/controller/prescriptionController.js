const Prescription = require("../models/prescriptionModel");
const Appointment = require("../models/appointmentModel");
const DoctorProfile = require("../models/doctorProfileModel");
const User = require("../models/userModel");
const Slot = require("../models/slotModel");
const createError = require("http-errors");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Locate Bengali / Unicode compatible font
const getBengaliFont = () => {
  const candidateFonts = [
    "C:/Windows/Fonts/kalpurush.ttf",
    "C:/Windows/Fonts/Nirmala.ttf",
    path.join(__dirname, "../fonts/kalpurush.ttf"),
    path.join(__dirname, "../../fonts/kalpurush.ttf"),
    "/usr/share/fonts/truetype/noto/NotoSansBengali-Regular.ttf",
  ];
  return candidateFonts.find((f) => fs.existsSync(f)) || null;
};

// POST /api/prescriptions   (doctor only)
const createPrescription = async (req, res, next) => {
  try {
    const {
      appointmentId,
      diagnosis,
      medicines,
      notes,
      tests,
      patientAge,
      patientGender,
      patientName,
    } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate("patient", "name");
    if (!appointment) throw createError(404, "Appointment not found");

    // Enforce doctor authorization and appointment ownership check
    const appointmentDoctorId = (appointment.doctor?._id || appointment.doctor || "").toString();
    const requestingDoctorId = (req.user?._id || req.user?.id || "").toString();

    if (appointmentDoctorId !== requestingDoctorId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this appointment",
      });
    }

    if (!["approved", "completed"].includes(appointment.status)) {
      throw createError(
        400,
        "Prescription can only be written for an approved appointment"
      );
    }
    if (!diagnosis || typeof diagnosis !== "string" || !diagnosis.trim()) {
      throw createError(
        400,
        "Diagnosis and at least one medicine are required"
      );
    }
    if (!Array.isArray(medicines) || medicines.length === 0) {
      throw createError(
        400,
        "Diagnosis and at least one medicine are required"
      );
    }

    // Preserve raw UTF-8 strings for Bengali medicines, dosage & instructions
    const sanitizedMedicines = medicines.map((m) => ({
      name: String(m.name || "").trim(),
      dosage: String(m.dosage || "").trim(),
      duration: String(m.duration || "").trim(),
    }));

    // Process medical/diagnostic tests
    let sanitizedTests = [];
    if (Array.isArray(tests)) {
      sanitizedTests = tests
        .map((t) => (typeof t === "string" ? t.trim() : String(t?.name || "").trim()))
        .filter(Boolean);
    } else if (typeof tests === "string" && tests.trim()) {
      sanitizedTests = tests
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const finalPatientName = patientName
      ? String(patientName).trim()
      : (appointment.patient?.name || "");
    const finalPatientAge =
      patientAge !== undefined && patientAge !== null ? String(patientAge).trim() : "";
    const finalPatientGender =
      patientGender !== undefined && patientGender !== null ? String(patientGender).trim() : "";

    const prescription = await Prescription.findOneAndUpdate(
      { appointment: appointmentId },
      {
        appointment: appointmentId,
        doctor: req.user._id,
        patient: appointment.patient?._id || appointment.patient,
        patientName: finalPatientName,
        patientAge: finalPatientAge,
        patientGender: finalPatientGender,
        diagnosis: diagnosis.trim(),
        medicines: sanitizedMedicines,
        tests: sanitizedTests,
        notes: notes ? String(notes).trim() : "",
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Atomically mark appointment as completed and link prescription
    appointment.status = "completed";
    appointment.prescription = prescription._id;
    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Prescription saved and consultation completed successfully",
      payload: { prescription, appointment },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/prescriptions/appointment/:appointmentId
const getPrescriptionByAppointment = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      appointment: req.params.appointmentId,
    })
      .populate("doctor", "name email")
      .populate("patient", "name email phone");

    if (!prescription) throw createError(404, "Prescription not found");

    // only the doctor who wrote it, the patient it belongs to, or admin can view it
    const isOwner =
      prescription.doctor._id.toString() === req.user._id.toString() ||
      prescription.patient._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      throw createError(403, "Not authorized");
    }

    const doctorProfile = await DoctorProfile.findOne({
      user: prescription.doctor._id,
    });

    res.status(200).json({
      success: true,
      payload: {
        ...prescription.toObject(),
        doctorProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/prescriptions/:appointmentId/download   (patient's "medical report")
const downloadPrescriptionPdf = async (req, res, next) => {
  try {
    const prescription = await Prescription.findOne({
      appointment: req.params.appointmentId,
    })
      .populate("doctor", "name email")
      .populate("patient", "name email phone");

    if (!prescription) throw createError(404, "Prescription not found");

    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("slot", "date startTime endTime");

    const isOwner =
      prescription.doctor._id.toString() === req.user._id.toString() ||
      prescription.patient._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      throw createError(403, "Not authorized");
    }

    const doctorProfile = await DoctorProfile.findOne({
      user: prescription.doctor._id,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Prescription-${prescription._id.toString().slice(-6)}.pdf`
    );

    const bengaliFont = getBengaliFont();
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    if (bengaliFont) {
      doc.registerFont("Bengali", bengaliFont);
      doc.registerFont("Bengali-Bold", bengaliFont);
    }
    const fontRegular = bengaliFont ? "Bengali" : "Helvetica";
    const fontBold = bengaliFont ? "Bengali-Bold" : "Helvetica-Bold";

    doc.pipe(res);

    // Top Brand Header Banner
    doc.rect(40, 40, 515, 75).fill("#0f766e"); // teal-700
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font(fontBold)
      .text("DocSheba Medical Center", 55, 52);
    doc
      .font(fontRegular)
      .fontSize(10)
      .text("Official Digital Clinical Prescription & Medical Record", 55, 78);
    doc.fontSize(11).text("e-PRESCRIPTION", 420, 58, { align: "right" });

    // Doctor & Patient info
    doc.fillColor("#1e293b");
    const docInfoY = 130;
    doc
      .fontSize(12)
      .font(fontBold)
      .text(`Dr. ${prescription.doctor.name}`, 45, docInfoY);
    doc.fontSize(9).font(fontRegular).fillColor("#475569");
    doc.text(
      `${doctorProfile?.qualification || "Licensed Physician"} · ${
        doctorProfile?.specialization || "Clinical Specialist"
      }`,
      45,
      docInfoY + 16
    );
    if (doctorProfile?.bmdcNumber) {
      doc.text(`BMDC Reg: ${doctorProfile.bmdcNumber}`, 45, docInfoY + 28);
    }

    // Patient info on right - with Name, Age, Gender, Date
    doc
      .fillColor("#1e293b")
      .font(fontBold)
      .fontSize(10)
      .text("PATIENT INFORMATION", 310, docInfoY);
    doc.font(fontRegular).fontSize(8.5).fillColor("#475569");
    const patientDisplayName =
      prescription.patientName || prescription.patient?.name || "N/A";
    const patientDisplayAge = prescription.patientAge
      ? `${prescription.patientAge} Years`
      : "N/A";
    const patientDisplayGender = prescription.patientGender || "N/A";
    const apptDateStr = appointment?.slot?.date
      ? new Date(appointment.slot.date).toDateString()
      : new Date(prescription.createdAt).toDateString();

    doc.text(`Name: ${patientDisplayName}`, 310, docInfoY + 14);
    doc.text(`Age: ${patientDisplayAge}   |   Gender: ${patientDisplayGender}`, 310, docInfoY + 26);
    doc.text(`Date of Visit: ${apptDateStr}`, 310, docInfoY + 38);
    if (prescription.patient?.phone) {
      doc.text(`Contact: ${prescription.patient.phone}`, 310, docInfoY + 50);
    }

    // Separator line
    doc
      .strokeColor("#cbd5e1")
      .lineWidth(1)
      .moveTo(40, docInfoY + 65)
      .lineTo(555, docInfoY + 65)
      .stroke();

    // Clinical Diagnosis Banner
    const diagY = docInfoY + 75;
    doc.rect(40, diagY, 515, 30).fill("#f0fdfa"); // teal-50
    doc
      .fillColor("#0f766e")
      .font(fontBold)
      .fontSize(11)
      .text("DIAGNOSIS / CLINICAL FINDINGS:", 50, diagY + 9);
    doc
      .fillColor("#1e293b")
      .font(fontRegular)
      .fontSize(10)
      .text(prescription.diagnosis, 270, diagY + 9);

    // Rx Symbol & Medicines Section
    const rxY = diagY + 45;
    doc
      .fillColor("#0f766e")
      .font(fontBold)
      .fontSize(26)
      .text("Rx", 45, rxY);

    // Medicines Table Header
    const medTableY = rxY + 35;
    doc.rect(40, medTableY, 515, 24).fill("#f1f5f9");
    doc.fillColor("#334155").font(fontBold).fontSize(9);
    doc.text("#", 50, medTableY + 7);
    doc.text("MEDICINE NAME", 80, medTableY + 7);
    doc.text("DOSAGE / FREQUENCY", 290, medTableY + 7);
    doc.text("DURATION", 450, medTableY + 7);

    // Medicine Rows
    let currentY = medTableY + 28;
    prescription.medicines.forEach((med, index) => {
      doc.font(fontBold).fontSize(9).fillColor("#0f172a");
      doc.text(`${index + 1}.`, 50, currentY);
      doc.text(med.name, 80, currentY);

      doc.font(fontRegular).fontSize(9).fillColor("#334155");
      doc.text(med.dosage, 290, currentY);
      doc.text(med.duration, 450, currentY);

      doc
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .moveTo(40, currentY + 16)
        .lineTo(555, currentY + 16)
        .stroke();
      currentY += 24;
    });

    // Medical / Diagnostic Tests Section (if prescribed)
    if (prescription.tests && prescription.tests.length > 0) {
      currentY += 14;
      doc.rect(40, currentY, 515, 22).fill("#f0fdf4");
      doc
        .fillColor("#065f46")
        .font(fontBold)
        .fontSize(9.5)
        .text("RECOMMENDED DIAGNOSTIC TESTS / প্যাথলজিক্যাল পরীক্ষা:", 50, currentY + 6);
      currentY += 28;

      prescription.tests.forEach((testItem, idx) => {
        doc.font(fontRegular).fontSize(9).fillColor("#1e293b");
        doc.text(`${idx + 1}. ${testItem}`, 55, currentY);
        currentY += 18;
      });
    }

    // Advice / Instructions
    if (prescription.notes) {
      currentY += 12;
      doc.rect(40, currentY, 515, 22).fill("#f8fafc");
      doc
        .fillColor("#0f766e")
        .font(fontBold)
        .fontSize(10)
        .text("ADVICE & INSTRUCTIONS / চিকিৎসকের পরামর্শ:", 50, currentY + 6);
      currentY += 28;
      doc
        .fillColor("#334155")
        .font(fontRegular)
        .fontSize(9)
        .text(prescription.notes, 50, currentY, {
          width: 495,
          lineGap: 3,
        });
      currentY += 40;
    }

    // Signature line
    const signY = Math.max(currentY + 35, 680);
    doc
      .strokeColor("#94a3b8")
      .lineWidth(1)
      .moveTo(380, signY)
      .lineTo(540, signY)
      .stroke();
    doc
      .fillColor("#1e293b")
      .font(fontBold)
      .fontSize(9)
      .text(`Dr. ${prescription.doctor.name}`, 380, signY + 6, {
        align: "center",
        width: 160,
      });
    doc
      .font(fontRegular)
      .fontSize(8)
      .fillColor("#64748b")
      .text("Registered Medical Practitioner", 380, signY + 18, {
        align: "center",
        width: 160,
      });

    // Bottom verification notice
    doc.fontSize(8).font(fontRegular).fillColor("#94a3b8");
    doc.text(
      "DocSheba Health Portal · Digitally Certified Prescription · Not valid for narcotic substances",
      40,
      760,
      { align: "center", width: 515 }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPrescription,
  getPrescriptionByAppointment,
  downloadPrescriptionPdf,
};
