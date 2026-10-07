const express = require('express')

const { isLoggedIn} = require('../middlewares/authMiddleware');
const { bookAppointment } = require('../controller/appointmentController');


const appointmentRouter = express.Router()


appointmentRouter.post("/",isLoggedIn, bookAppointment);

module.exports = appointmentRouter
