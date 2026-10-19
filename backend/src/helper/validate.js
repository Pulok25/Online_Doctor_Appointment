const createError = require("http-errors");

// Reject non-strings so {"$ne": null} style NoSQL operator injection never reaches Mongo.
const str = (value, field, { min = 1, max = 200 } = {}) => {
  if (typeof value !== "string") throw createError(400, `${field} must be a string`);
  const v = value.trim();
  if (v.length < min || v.length > max) throw createError(400, `${field} must be ${min}-${max} characters`);
  return v;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const intParam = (value, fallback, { min = 1, max = 100 } = {}) => {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const isObjectId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);

module.exports = { str, escapeRegex, intParam, isObjectId };
