const multer = require("multer");
const path = require("path");
const { doctorImagePath } = require("../secret");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, doctorImagePath);
  },
  filename: (req, file, cb) => {
    const ext = { "image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png", "image/webp": ".webp" }[file.mimetype];
    const uniqueName = `${Date.now()}-${req.user._id}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only jpeg, png, webp images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = upload;
