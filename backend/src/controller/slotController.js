const createError = require("http-errors");
const { str, isObjectId } = require("../helper/validate");
const Slot = require("../models/slotModel");
const { successResponse } = require("./responseController");

/**
 * Normalizes input date string/object to UTC midnight (00:00:00.000Z)
 * to avoid UTC vs local calendar-day shift issues across timezones.
 */
const normalizeDate = (dateInput) => {
  if (!dateInput) return null;
  let d;
  if (typeof dateInput === "string") {
    const parts = dateInput.trim().split(/[-/T ]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = new Date(dateInput);
  }
  if (Number.isNaN(d.getTime())) return null;
  return d;
};

/**
 * Converts 12h or 24h time strings (e.g. "09:00", "09:30 AM", "02:00 PM")
 * into total minutes from start of day for comparison.
 */
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return null;
  let [_, h, m, meridiem] = match;
  let hours = parseInt(h, 10);
  const minutes = parseInt(m, 10);
  if (minutes < 0 || minutes > 59) return null;
  if (meridiem) {
    const period = meridiem.toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
  }
  return hours * 60 + minutes;
};

/**
 * Validates whether a proposed time slot overlaps with any existing slot
 * for the same doctor on the specified date.
 */
const checkSlotOverlap = async (doctorId, normalizedDate, startMins, endMins, excludeSlotId = null) => {
  const existingSlots = await Slot.find({
    doctor: doctorId,
    date: normalizedDate,
    ...(excludeSlotId ? { _id: { $ne: excludeSlotId } } : {}),
  });

  for (const existing of existingSlots) {
    const exStart = parseTimeToMinutes(existing.startTime);
    const exEnd = parseTimeToMinutes(existing.endTime);
    if (exStart !== null && exEnd !== null) {
      // Overlap condition: startA < endB && endA > startB
      if (startMins < exEnd && endMins > exStart) {
        return existing;
      }
    }
  }
  return null;
};

// POST /api/slots (Doctors only)
const createSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      throw createError(400, "date, startTime and endTime are required");
    }

    str(date, "date", { max: 30 });
    str(startTime, "startTime", { max: 15 });
    str(endTime, "endTime", { max: 15 });

    const slotDate = normalizeDate(date);
    if (!slotDate) {
      throw createError(400, "invalid date format");
    }

    // Past date check
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    if (slotDate < todayUTC) {
      throw createError(400, "cannot create a slot for a past date");
    }

    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);
    if (startMins === null || endMins === null) {
      throw createError(400, "invalid startTime or endTime format (use e.g. 09:00, 10:30 AM)");
    }
    if (startMins >= endMins) {
      throw createError(400, "startTime must be strictly before endTime");
    }

    // Overlap validation
    const overlapping = await checkSlotOverlap(req.user._id, slotDate, startMins, endMins);
    if (overlapping) {
      throw createError(
        409,
        `Time slot overlaps with an existing slot (${overlapping.startTime} - ${overlapping.endTime}) on this date`
      );
    }

    let slot;
    try {
      slot = await Slot.create({
        doctor: req.user._id,
        date: slotDate,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
      });
    } catch (err) {
      if (err.code === 11000) {
        throw createError(409, "a slot with this date and start time already exists");
      }
      throw err;
    }

    return successResponse(res, {
      statusCode: 201,
      message: "slot created successfully",
      payload: { slot },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/slots/doctor/:doctorId or GET /api/slots/my-slots
const getDoctorSlots = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId || req.user?._id;
    if (!doctorId || !isObjectId(String(doctorId))) {
      throw createError(400, "invalid doctor id");
    }

    const filter = { doctor: doctorId };

    // When public clients view doctor slots, display only unbooked slots
    if (req.params.doctorId) {
      filter.isBooked = false;
    }

    // Optional query by specific date
    if (req.query.date) {
      const normalizedQueryDate = normalizeDate(req.query.date);
      if (normalizedQueryDate) {
        filter.date = normalizedQueryDate;
      }
    }

    const slots = await Slot.find(filter).sort({
      date: 1,
      startTime: 1,
    });

    return successResponse(res, {
      statusCode: 200,
      message: "slots fetched successfully",
      payload: { slots },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH / PUT /api/slots/:id (Doctor owner or Admin)
const updateSlot = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) {
      throw createError(400, "invalid slot id");
    }

    const existingSlot = await Slot.findById(req.params.id);
    if (!existingSlot) {
      throw createError(404, "slot not found");
    }

    // Ownership verification: Doctor A cannot modify Doctor B's slot
    if (req.user.role !== "admin" && existingSlot.doctor.toString() !== req.user._id.toString()) {
      throw createError(403, "unauthorized: you can only update your own slots");
    }

    // Booked slot update protection
    if (existingSlot.isBooked) {
      throw createError(
        409,
        "booked slots cannot be modified directly; please reschedule the appointment instead"
      );
    }

    const { date, startTime, endTime, isBooked, capacity } = req.body;
    const updateData = {};

    let targetDate = existingSlot.date;
    let targetStartTime = existingSlot.startTime;
    let targetEndTime = existingSlot.endTime;

    if (date !== undefined) {
      str(date, "date", { max: 30 });
      const parsedDate = normalizeDate(date);
      if (!parsedDate) {
        throw createError(400, "invalid date format");
      }
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      if (parsedDate < todayUTC) {
        throw createError(400, "slot date cannot be in the past");
      }
      targetDate = parsedDate;
      updateData.date = parsedDate;
    }

    if (startTime !== undefined) {
      str(startTime, "startTime", { max: 15 });
      targetStartTime = startTime.trim();
      updateData.startTime = targetStartTime;
    }

    if (endTime !== undefined) {
      str(endTime, "endTime", { max: 15 });
      targetEndTime = endTime.trim();
      updateData.endTime = targetEndTime;
    }

    const startMins = parseTimeToMinutes(targetStartTime);
    const endMins = parseTimeToMinutes(targetEndTime);
    if (startMins === null || endMins === null) {
      throw createError(400, "invalid startTime or endTime format");
    }
    if (startMins >= endMins) {
      throw createError(400, "startTime must be strictly before endTime");
    }

    // Overlap validation if date or time changed
    const overlapping = await checkSlotOverlap(
      existingSlot.doctor,
      targetDate,
      startMins,
      endMins,
      existingSlot._id
    );
    if (overlapping) {
      throw createError(
        409,
        `Time slot overlaps with an existing slot (${overlapping.startTime} - ${overlapping.endTime}) on this date`
      );
    }

    if (isBooked !== undefined) {
      if (typeof isBooked !== "boolean") {
        throw createError(400, "isBooked must be a boolean");
      }
      updateData.isBooked = isBooked;
    }

    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (!Number.isFinite(capNum) || capNum < 1) {
        throw createError(400, "capacity must be a positive number");
      }
      updateData.capacity = capNum;
    }

    let slot;
    try {
      slot = await Slot.findByIdAndUpdate(
        existingSlot._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
    } catch (err) {
      if (err.code === 11000) {
        throw createError(409, "a slot with this date and start time already exists for this doctor");
      }
      throw err;
    }

    return successResponse(res, {
      statusCode: 200,
      message: "slot updated successfully",
      payload: { slot },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/slots/:id (Doctor owner or Admin)
const deleteSlot = async (req, res, next) => {
  try {
    if (!isObjectId(req.params.id)) {
      throw createError(400, "invalid slot id");
    }

    const slot = await Slot.findById(req.params.id);
    if (!slot) {
      throw createError(404, "slot not found");
    }

    // Ownership verification: Doctor A cannot delete Doctor B's slot
    if (req.user.role !== "admin" && slot.doctor.toString() !== req.user._id.toString()) {
      throw createError(403, "unauthorized: you can only delete your own slots");
    }

    // Booked slot deletion protection
    if (slot.isBooked) {
      throw createError(
        409,
        "booked slots cannot be deleted directly; please cancel or reschedule the appointment first"
      );
    }

    await Slot.findByIdAndDelete(slot._id);

    return successResponse(res, {
      statusCode: 200,
      message: "slot deleted successfully",
      payload: { slot },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSlot,
  getDoctorSlots,
  updateSlot,
  deleteSlot,
  normalizeDate,
  parseTimeToMinutes,
};
