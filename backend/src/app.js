const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const createError = require("http-errors");
const { errorResponse } = require("./controller/responseController");
const userRouter = require("./router/userRouter");
const doctorRouter = require("./router/doctorRouter");
const slotRouter = require("./router/slotRouter");
const appointmentRouter = require("./router/appointmentRouter");



const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "api is working successfully",
  });
});

app.use("/api/users", userRouter);
app.use('/api/doctors', doctorRouter)
app.use("/api/slots", slotRouter)
app.use("/api/appointments", appointmentRouter)

// 404 handler
app.use((req, res, next) => {
  next(createError(404, "route not found"));
});

// error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  if (statusCode === 500) console.error(err.stack);

  return errorResponse(res, {
    statusCode,
    message: statusCode === 500 ? "Internal Server Error" : err.message,
  });
});

module.exports = app;