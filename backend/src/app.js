const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const createError = require("http-errors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { clientOrigin, isProd } = require("./secret");
const { errorResponse } = require("./controller/responseController");
const userRouter = require("./router/userRouter");
const doctorRouter = require("./router/doctorRouter");
const slotRouter = require("./router/slotRouter");
const appointmentRouter = require("./router/appointmentRouter");



const app = express();
// middlewares
app.disable("x-powered-by");
// set to the number of proxies in front of the app (e.g. 1 behind nginx) so rate limiting sees real IPs
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // images are served to the SPA origin
app.use(cors({ origin: clientOrigin }));
app.use(morgan(isProd ? "combined" : "dev"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, limit: max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });
app.use(limiter(60 * 1000, 120, "too many requests, slow down"));
app.use("/api/users/login", limiter(15 * 60 * 1000, 10, "too many login attempts, try again later"));
app.use("/api/users/register", limiter(60 * 60 * 1000, 10, "too many registrations, try again later"));
app.use("/api/users/activate", limiter(60 * 60 * 1000, 20, "too many attempts, try again later"));

app.use("/public", express.static("public", { dotfiles: "deny", index: false }));

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