const express = require('express');
const { isLoggedIn, isDoctor } = require('../middlewares/authMiddleware');
const { createPrescription, getPrescriptionByAppointment, downloadPrescriptionPdf } = require('../controller/prescriptionController');




const prescriptionRouter = express.Router()

prescriptionRouter.post("/", isLoggedIn, isDoctor, createPrescription)
prescriptionRouter.get("/appointment/:appointmentId", isLoggedIn,getPrescriptionByAppointment)
prescriptionRouter.get("/:appointmentId/download",isLoggedIn, downloadPrescriptionPdf)

module.exports = prescriptionRouter