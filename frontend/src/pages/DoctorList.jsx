import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  Award,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Stethoscope,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";

export default function DoctorList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState(
    searchParams.get("search") || searchParams.get("specialization") || ""
  );
  const [selectedSpecialtyChip, setSelectedSpecialtyChip] = useState(
    searchParams.get("search") || "All"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [reason, setReason] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const specialtyFilters = [
    "All",
    "Cardiologist",
    "General Physician",
    "Neurologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic",
  ];

  const fetchDoctors = async (query = specialization) => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/doctors", {
        params: query && query !== "All" ? { specialization: query } : {},
      });
      setDoctors(res.data.payload.doctors);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery =
      searchParams.get("search") || searchParams.get("specialization") || "";
    if (initialQuery) {
      setSpecialization(initialQuery);
      setSelectedSpecialtyChip(initialQuery);
      fetchDoctors(initialQuery);
    } else {
      fetchDoctors("");
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors(specialization);
  };

  const handleChipClick = (chip) => {
    setSelectedSpecialtyChip(chip);
    if (chip === "All") {
      setSpecialization("");
      fetchDoctors("");
    } else {
      setSpecialization(chip);
      fetchDoctors(chip);
    }
  };

  const openBooking = async (doctor) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlotId(null);
    setReason("");
    setBookingError("");
    setBookingSuccess(false);
    setSlotsLoading(true);

    try {
      const res = await axiosInstance.get(`/slots/doctor/${doctor.user._id}`);
      setSlots(res.data.payload.slots);
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Failed to load doctor's available slots"
      );
    } finally {
      setSlotsLoading(false);
    }
  };

  const closeBooking = () => {
    setSelectedDoctor(null);
    setBookingSuccess(false);
  };

  const handleBook = async () => {
    if (!selectedSlotId) {
      setBookingError("Please select a time slot to proceed");
      return;
    }
    setBooking(true);
    setBookingError("");
    try {
      await axiosInstance.post("/appointments", {
        slotId: selectedSlotId,
        reason,
      });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Booking failed or slot already taken"
      );
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 medical-bg-mesh pb-20">
      {/* Top Banner */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Verified Medical Specialists
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Find & Consult Doctors
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Select your specialist, review credentials, and lock an appointment slot
              </p>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-96">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search specialization..."
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-98"
              >
                Search
              </motion.button>
            </form>
          </div>

          {/* Specialty Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-1 no-scrollbar">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {specialtyFilters.map((spec) => {
              const isSelected =
                selectedSpecialtyChip === spec ||
                (spec === "All" && !specialization);
              return (
                <motion.button
                  key={spec}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChipClick(spec)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                  }`}
                >
                  {spec}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-9 h-9 border-3 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">
              Loading verified doctors...
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 max-w-lg mx-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-md mx-auto p-8"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Stethoscope className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">No Doctors Found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              We couldn't find any verified specialists matching "{specialization}".
            </p>
            <button
              onClick={() => handleChipClick("All")}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              View All Doctors
            </button>
          </motion.div>
        )}

        {/* Doctor Grid with Staggered Entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc, idx) => {
            const hasCustomImage = doc.image && !doc.image.includes("default");
            const imageUrl = hasCustomImage
              ? `http://localhost:3001/${doc.image}`
              : null;

            return (
              <motion.div
                key={doc._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-200/80 transition-all flex flex-col justify-between overflow-hidden group cursor-default"
              >
                <div className="p-6">
                  {/* Top Doctor Avatar & Details */}
                  <div className="flex items-start gap-4">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={doc.user?.name}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-100 flex-shrink-0 group-hover:ring-teal-300 transition-all"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-50 to-cyan-100 text-teal-800 font-bold text-lg flex items-center justify-center border border-teal-200/60 flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        {doc.user?.name?.[0]?.toUpperCase() || "D"}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-slate-900 truncate">
                          Dr. {doc.user?.name}
                        </h3>
                        <ShieldCheck
                          className="w-4 h-4 text-teal-600 flex-shrink-0"
                          title="BMDC Verified Specialist"
                        />
                      </div>
                      <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                        {doc.specialization}
                      </span>
                    </div>
                  </div>

                  {/* Qualifications & Experience */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{doc.qualification}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>{doc.experienceYears} Years Clinical Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="text-teal-700 font-semibold text-xs">
                        Verified by BMDC
                      </span>
                    </div>
                  </div>

                  {doc.bio && (
                    <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed italic">
                      "{doc.bio}"
                    </p>
                  )}
                </div>

                {/* Footer with Fee and Book CTA */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Consultation
                    </span>
                    <span className="text-base font-extrabold text-slate-800">
                      ৳{doc.fee}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => openBooking(doc)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 active:scale-98"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book Slot
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBooking}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative z-10 bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-lg w-full overflow-hidden"
            >
              {bookingSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-xs"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Appointment Requested!
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Your appointment with{" "}
                    <strong className="text-slate-800">
                      Dr. {selectedDoctor.user?.name}
                    </strong>{" "}
                    has been submitted and is currently pending admin review.
                  </p>
                  <div className="pt-4 flex gap-3">
                    <button
                      onClick={() => {
                        closeBooking();
                        navigate("/patient/dashboard");
                      }}
                      className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
                    >
                      Go to Patient Dashboard
                    </button>
                    <button
                      onClick={closeBooking}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Modal Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {selectedDoctor.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          Dr. {selectedDoctor.user?.name}
                        </h3>
                        <p className="text-xs text-teal-700 font-medium">
                          {selectedDoctor.specialization} · Fee: ৳
                          {selectedDoctor.fee}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={closeBooking}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Slot Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                        Available Consultation Slots
                      </label>

                      {slotsLoading && (
                        <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                          <div className="w-6 h-6 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
                          <span className="text-xs font-medium">
                            Fetching doctor slots...
                          </span>
                        </div>
                      )}

                      {!slotsLoading && slots.length === 0 && !bookingError && (
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                          <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                          <p className="text-xs font-semibold text-slate-700">
                            No open slots at the moment
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            This doctor hasn't scheduled any available consultation times yet.
                          </p>
                        </div>
                      )}

                      {!slotsLoading && slots.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                          {slots.map((slot) => {
                            const isSelected = selectedSlotId === slot._id;
                            return (
                              <motion.label
                                key={slot._id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-teal-600 bg-teal-50/70 text-teal-900 shadow-xs ring-1 ring-teal-500"
                                    : "border-slate-200 hover:border-teal-200 hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="slot"
                                  checked={isSelected}
                                  onChange={() => setSelectedSlotId(slot._id)}
                                  className="accent-teal-600"
                                />
                                <div>
                                  <span className="font-semibold block text-slate-800">
                                    {slot.date?.slice(0, 10)}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                </div>
                              </motion.label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Reason text area */}
                    {slots.length > 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                          Reason for Visit{" "}
                          <span className="text-slate-400 font-normal">
                            (Optional)
                          </span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Chest pain follow-up, routine health checkup..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                        />
                      </div>
                    )}

                    {/* Booking Error */}
                    {bookingError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      onClick={closeBooking}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    {slots.length > 0 && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleBook}
                        disabled={booking || !selectedSlotId}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 disabled:opacity-60 flex items-center gap-2 active:scale-98"
                      >
                        {booking ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Locking Slot...</span>
                          </>
                        ) : (
                          <span>Confirm Appointment</span>
                        )}
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}