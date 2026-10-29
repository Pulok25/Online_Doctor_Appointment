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
    path.join(__dirname, "../../fonts/kalpurush.ttf"),
    path.join(__dirname, "../fonts/kalpurush.ttf"),
    path.join(__dirname, "../../../fonts/kalpurush.ttf"),
    "C:/Windows/Fonts/kalpurush.ttf",
    "C:/Windows/Fonts/Nirmala.ttf",
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
    const hasBengali = (text) => /[\u0980-\u09FF]/.test(String(text || ""));
    const fontOf = (text, isBold = false) => {
      if (bengaliFont && hasBengali(text)) {
        return isBold ? "Bengali-Bold" : "Bengali";
      }
      return isBold ? "Helvetica-Bold" : "Helvetica";
    };
    const fontRegular = "Helvetica";
    const fontBold = "Helvetica-Bold";

    doc.pipe(res);

    // ==========================================
    // 1. MODERN TOP HEADER DECORATIVE WAVES
    // ==========================================
    doc.save();
    // Primary deep teal curve
    doc.moveTo(0, 0)
       .lineTo(595, 0)
       .lineTo(595, 75)
       .bezierCurveTo(450, 110, 250, 60, 0, 95)
       .closePath()
       .fill("#0f766e");

    // Lighter cyan overlay accent wave
    doc.opacity(0.35)
       .moveTo(0, 0)
       .lineTo(595, 0)
       .lineTo(595, 45)
       .bezierCurveTo(400, 95, 180, 50, 0, 85)
       .closePath()
       .fill("#14b8a6");

    // Top-right soft ambient glow
    doc.opacity(0.12)
       .circle(550, 20, 90)
       .fill("#5eead4");
    doc.restore();

    // ==========================================
    // 2. CENTRAL CLINICAL WATERMARK
    // ==========================================
    doc.save();
    doc.opacity(0.045);
    const cx = 297.5;
    const cy = 440;

    // Outer emblem ring
    doc.circle(cx, cy, 140).lineWidth(5).strokeColor("#0f766e").stroke();
    doc.circle(cx, cy, 128).lineWidth(1.5).stroke();

    // Medical Caduceus Cross
    const crossW = 28, crossH = 80;
    doc.rect(cx - crossW / 2, cy - crossH / 2, crossW, crossH).fill("#0f766e");
    doc.rect(cx - crossH / 2, cy - crossW / 2, crossH, crossW).fill("#0f766e");

    // Watermark Typography
    doc.fillColor("#0f766e")
       .font(fontBold)
       .fontSize(32)
       .text("DocSheba", cx - 150, cy + 95, { width: 300, align: "center" });
    doc.fontSize(11)
       .font(fontRegular)
       .text("OFFICIAL CLINICAL PRESCRIPTION", cx - 150, cy + 132, { width: 300, align: "center" });
    doc.restore();

    // ==========================================
    // 3. TOP CLINIC BRANDING IN HEADER
    // ==========================================
    // White logo box with teal medical cross
    doc.roundedRect(42, 22, 34, 34, 8).fill("#ffffff");
    doc.rect(56, 28, 6, 22).fill("#0f766e");
    doc.rect(48, 36, 22, 6).fill("#0f766e");

    doc.fillColor("#ffffff")
       .font(fontBold)
       .fontSize(19)
       .text("DocSheba Medical Center", 86, 22);

    doc.font(fontRegular)
       .fontSize(8.5)
       .fillColor("#ccfbf1")
       .text("Government & BMDC Certified Healthcare Network · Digital e-Prescription Pad", 86, 44);

    // ==========================================
    // 4. DOCTOR PROFILE & METADATA
    // ==========================================
    const docInfoY = 110;
    doc.fillColor("#0f172a")
       .font(fontBold)
       .fontSize(14)
       .text(`Dr. ${prescription.doctor.name}`, 42, docInfoY);

    doc.font(fontRegular)
       .fontSize(9)
       .fillColor("#0f766e")
       .text(
         `${doctorProfile?.qualification || "Licensed Physician"} · ${
           doctorProfile?.specialization || "Clinical Specialist"
         }`,
         42,
         docInfoY + 18
       );

    doc.font(fontRegular)
       .fontSize(8.5)
       .fillColor("#64748b")
       .text(
         `BMDC Reg: ${doctorProfile?.bmdcNumber || "Verified"} · OPD Clinical Consultation`,
         42,
         docInfoY + 31
       );

    // Prescription Serial & Date on the right
    const apptDateStr = appointment?.slot?.date
      ? new Date(appointment.slot.date).toDateString()
      : new Date(prescription.createdAt).toDateString();

    doc.font(fontBold)
       .fontSize(8.5)
       .fillColor("#475569")
       .text("Rx Serial:", 400, docInfoY, { width: 70, align: "right" });
    doc.font(fontRegular)
       .fontSize(8.5)
       .fillColor("#0f172a")
       .text(`DS-${prescription._id.toString().slice(-6).toUpperCase()}`, 475, docInfoY, { width: 80, align: "right" });

    doc.font(fontBold)
       .fontSize(8.5)
       .fillColor("#475569")
       .text("Date:", 400, docInfoY + 16, { width: 70, align: "right" });
    doc.font(fontRegular)
       .fontSize(8.5)
       .fillColor("#0f172a")
       .text(apptDateStr, 475, docInfoY + 16, { width: 80, align: "right" });

    // ==========================================
    // 5. PATIENT INFORMATION CARD (MODERN STRIP)
    // ==========================================
    const ptCardY = docInfoY + 50;
    doc.roundedRect(42, ptCardY, 511, 46, 8)
       .fillAndStroke("#f8fafc", "#e2e8f0");

    const patientDisplayName =
      prescription.patientName || prescription.patient?.name || "N/A";
    const patientDisplayAge = prescription.patientAge
      ? `${prescription.patientAge} Years`
      : "N/A";
    const patientDisplayGender = prescription.patientGender || "N/A";

    // Line 1: Name & Age
    doc.font(fontBold).fontSize(8.5).fillColor("#64748b").text("PATIENT NAME:", 54, ptCardY + 9);
    doc.font(fontOf(patientDisplayName, true)).fontSize(9.5).fillColor("#0f172a").text(patientDisplayName, 135, ptCardY + 9, { width: 240 });

    doc.font(fontBold).fontSize(8.5).fillColor("#64748b").text("AGE:", 380, ptCardY + 9);
    doc.font(fontOf(patientDisplayAge, false)).fontSize(9).fillColor("#0f172a").text(patientDisplayAge, 415, ptCardY + 9, { width: 125 });

    // Line 2: Gender & Contact
    doc.font(fontBold).fontSize(8.5).fillColor("#64748b").text("GENDER:", 54, ptCardY + 26);
    doc.font(fontOf(patientDisplayGender, false)).fontSize(9).fillColor("#0f172a").text(patientDisplayGender, 110, ptCardY + 26, { width: 130 });

    doc.font(fontBold).fontSize(8.5).fillColor("#64748b").text("PHONE:", 250, ptCardY + 26);
    doc.font(fontRegular).fontSize(9).fillColor("#0f172a").text(prescription.patient?.phone || "N/A", 305, ptCardY + 26, { width: 230 });

    // ==========================================
    // 6. CLINICAL DIAGNOSIS BANNER
    // ==========================================
    const diagY = ptCardY + 54;
    doc.roundedRect(42, diagY, 511, 26, 6)
       .fillAndStroke("#f0fdfa", "#99f6e4");

    doc.font(fontBold)
       .fontSize(9)
       .fillColor("#0f766e")
       .text("DIAGNOSIS:", 54, diagY + 8);

    doc.font(fontOf(prescription.diagnosis, false))
       .fontSize(9)
       .fillColor("#134e4a")
       .text(prescription.diagnosis || "", 125, diagY + 8, { width: 420 });

    // ==========================================
    // 7. Rx SYMBOL & MEDICINES SECTION
    // ==========================================
    const rxY = diagY + 34;
    doc.font("Helvetica-Bold")
       .fontSize(24)
       .fillColor("#0f766e")
       .text("Rx", 42, rxY);

    // Medicines Table Header
    const tblY = rxY + 30;
    doc.roundedRect(42, tblY, 511, 22, 4).fill("#f1f5f9");
    doc.fillColor("#334155").font(fontBold).fontSize(8.5);
    doc.text("#", 50, tblY + 6, { width: 20 });
    doc.text("MEDICINE NAME", 72, tblY + 6, { width: 195 });
    doc.text("DOSAGE / FREQUENCY", 272, tblY + 6, { width: 168 });
    doc.text("DURATION", 445, tblY + 6, { width: 100 });

    // Medicine Rows
    let curY = tblY + 24;
    prescription.medicines.forEach((med, index) => {
      const nameFont = fontOf(med.name, true);
      const dosageFont = fontOf(med.dosage, false);
      const durationFont = fontOf(med.duration, false);

      const nameH = doc.font(nameFont).fontSize(8.5).heightOfString(med.name || "", { width: 195 });
      const dosageH = doc.font(dosageFont).fontSize(8.5).heightOfString(med.dosage || "", { width: 168 });
      const durationH = doc.font(durationFont).fontSize(8.5).heightOfString(med.duration || "", { width: 100 });
      const rowH = Math.max(22, nameH + 8, dosageH + 8, durationH + 8);

      doc.font(fontBold).fontSize(8.5).fillColor("#0f766e").text(`${index + 1}.`, 50, curY + 4, { width: 20 });
      doc.font(nameFont).fontSize(8.5).fillColor("#0f172a").text(med.name || "", 72, curY + 4, { width: 195 });
      doc.font(dosageFont).fontSize(8.5).fillColor("#334155").text(med.dosage || "", 272, curY + 4, { width: 168 });
      doc.font(durationFont).fontSize(8.5).fillColor("#334155").text(med.duration || "", 445, curY + 4, { width: 100 });

      curY += rowH;
      doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(42, curY).lineTo(553, curY).stroke();
    });

    // ==========================================
    // 8. DIAGNOSTIC TESTS (IF PRESCRIBED)
    // ==========================================
    if (prescription.tests && prescription.tests.length > 0) {
      curY += 10;
      const testBoxH = 26 + prescription.tests.length * 16;
      doc.roundedRect(42, curY, 511, testBoxH, 6)
         .fillAndStroke("#f0fdf4", "#bbf7d0");

      doc.font(fontBold)
         .fontSize(9)
         .fillColor("#166534")
         .text("RECOMMENDED DIAGNOSTIC TESTS:", 54, curY + 8);

      let tY = curY + 24;
      prescription.tests.forEach((testItem, idx) => {
        doc.font(fontOf(testItem, false)).fontSize(8.5).fillColor("#14532d").text(`${idx + 1}. ${testItem}`, 54, tY, { width: 485 });
        tY += 16;
      });
      curY += testBoxH;
    }

    // ==========================================
    // 9. ADVICE / INSTRUCTIONS
    // ==========================================
    if (prescription.notes) {
      curY += 8;
      const notesFont = fontOf(prescription.notes, false);
      const notesH = doc.font(notesFont).fontSize(8.5).heightOfString(prescription.notes, { width: 485, lineGap: 2 });
      const boxH = Math.max(46, notesH + 28);

      doc.roundedRect(42, curY, 511, boxH, 6)
         .fillAndStroke("#f8fafc", "#e2e8f0");

      doc.font(fontBold)
         .fontSize(9)
         .fillColor("#0f766e")
         .text("ADVICE & CLINICAL INSTRUCTIONS:", 54, curY + 8);

      doc.font(notesFont)
         .fontSize(8.5)
         .fillColor("#334155")
         .text(prescription.notes, 54, curY + 21, {
           width: 485,
           lineGap: 2,
         });
      curY += boxH;
    }

    // ==========================================
    // 10. SIGNATURE LINE & DIGITAL SEAL
    // ==========================================
    const signY = Math.min(Math.max(curY + 15, 680), 730);

    // Doctor signature line
    doc.strokeColor("#94a3b8").lineWidth(1).moveTo(380, signY).lineTo(540, signY).stroke();
    doc.font(fontBold).fontSize(9).fillColor("#0f172a").text(`Dr. ${prescription.doctor.name}`, 380, signY + 5, { width: 160, align: "center" });
    doc.font(fontRegular).fontSize(8).fillColor("#64748b").text("Registered Medical Practitioner", 380, signY + 16, { width: 160, align: "center" });

    // Digital verification certification badge
    doc.roundedRect(42, signY - 8, 195, 32, 6).fillAndStroke("#ecfdf5", "#a7f3d0");
    doc.circle(53, signY + 8, 6).fill("#059669");
    doc.save().strokeColor("#ffffff").lineWidth(1.5).moveTo(50, signY + 8).lineTo(52.5, signY + 10.5).lineTo(56.5, signY + 5.5).stroke().restore();
    doc.font(fontBold).fontSize(8).fillColor("#059669").text("DIGITALLY CERTIFIED PRESCRIPTION", 65, signY + 1);
    doc.font(fontRegular).fontSize(7).fillColor("#047857").text("Verified via DocSheba Healthcare Network", 65, signY + 12);

    // ==========================================
    // 11. MODERN CURVED FOOTER WAVES (SINGLE PAGE GUARANTEED)
    // ==========================================
    doc.page.margins.bottom = 0;

    doc.save();
    doc.moveTo(0, 842)
       .lineTo(595, 842)
       .lineTo(595, 785)
       .bezierCurveTo(420, 810, 180, 770, 0, 795)
       .closePath()
       .fill("#0f766e");

    doc.opacity(0.3)
       .moveTo(0, 842)
       .lineTo(595, 842)
       .lineTo(595, 800)
       .bezierCurveTo(380, 825, 200, 780, 0, 810)
       .closePath()
       .fill("#14b8a6");
    doc.restore();

    doc.font(fontBold)
       .fontSize(8.5)
       .fillColor("#ffffff")
       .text("DocSheba Medical Center · 24/7 Digital Outpatient Clinic & Diagnostics", 0, 798, { align: "center", width: 595, lineBreak: false });

    doc.font(fontRegular)
       .fontSize(7.5)
       .fillColor("#ccfbf1")
       .text("Hotline: +880 1700-000000 · Support: support@docsheba.com · Valid for 30 days from issue", 0, 812, { align: "center", width: 595, lineBreak: false });

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
