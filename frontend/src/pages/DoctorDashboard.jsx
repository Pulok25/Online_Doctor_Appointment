import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Stethoscope,
  Plus,
  CalendarCheck,
  Check,
  Sparkles,
  Camera,
  Upload,
} from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState("appointments");
  const [photoUploading, setPhotoUploading] = useState(false);

  // Slots management state
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00",
    endTime: "09:30",
  });
  const [slotCreating, setSlotCreating] = useState(false);
  const [slotSuccess, setSlotSuccess] = useState("");
  const [slotError, setSlotError] = useState("");

  const fetchDoctorProfile = async () => {
    try {
      const res = await axiosInstance.get("/doctors/profile/me");
      setProfile(res.data.payload.profile);
    } catch (err) {
      console.log("Could not load doctor profile:", err);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/appointments/myappointment");
      setAppointments(res.data.payload.appointments);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchMySlots = async () => {
    setSlotsLoading(true);
    try {
      const res = await axiosInstance.get("/slots/my-slots");
      setSlots(res.data.payload.slots);
    } catch (err) {
      console.error(err);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
    fetchAppointments();
    fetchMySlots();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Photo must be less than 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setPhotoUploading(true);
    setError("");

    try {
      const res = await axiosInstance.patch("/doctors/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile(res.data.payload.profile);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile photo");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleComplete = async (id) => {
    setUpdatingId(id);
    setError("");
    try {
      await axiosInstance.patch(`/appointments/${id}/status`, {
        status: "completed",
      });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update appointment status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setSlotCreating(true);
    setSlotError("");
    setSlotSuccess("");

    try {
      await axiosInstance.post("/slots", slotForm);
      setSlotSuccess("Time slot created successfully!");
      await fetchMySlots();
      setTimeout(() => setSlotSuccess(""), 4000);
    } catch (err) {
      setSlotError(err.response?.data?.message || "Failed to create slot or slot already exists");
    } finally {
      setSlotCreating(false);
    }
  };

  const statusBadge = {
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      label: "Pending Admin Approval",
    },
    approved: {
      bg: "bg-sky-50 text-sky-700 border-sky-200/80",
      label: "Approved & Scheduled",
    },
    completed: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      label: "Visit Completed",
    },
    cancelled: {
      bg: "bg-rose-50 text-rose-700 border-rose-200/80",
      label: "Cancelled",
    },
  };

  const counts = {
    pending: appointments.filter((a) => a.status === "pending").length,
    approved: appointments.filter((a) => a.status === "approved").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  const doctorPhotoUrl = profile?.image ? `http://localhost:3001/${profile.image}` : null;

  return (
    <div className="min-h-screen bg-slate-50/70 medical-bg-mesh pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Doctor Photo with Quick Upload trigger */}
            <div className="relative group flex-shrink-0">
              {doctorPhotoUrl ? (
                <img
                  src={doctorPhotoUrl}
                  alt={user?.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-100 to-teal-100 text-teal-800 font-bold text-2xl flex items-center justify-center border border-teal-200 shadow-xs">
                  {user?.name?.[0]?.toUpperCase() || "D"}
                </div>
              )}

              {/* Upload badge */}
              <label
                htmlFor="doctor-photo-input"
                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-md cursor-pointer transition-transform active:scale-95 group-hover:scale-110 flex items-center justify-center"
                title="Upload or Change Photo"
              >
                {photoUploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <input
                  id="doctor-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handlePhotoUpload}
                  disabled={photoUploading}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-1.5">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{profile?.specialization || "Clinical Specialist"}</span>
                {profile?.bmdcNumber && (
                  <span className="text-[11px] text-teal-600 font-mono">
                    · BMDC Verified
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Dr. {user?.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {profile?.qualification || "Licensed Physician"} · Fee: ৳{profile?.fee || "N/A"}
              </p>
            </div>
          </div>

          {/* Tab selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "appointments"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Patient Appointments ({appointments.length})
            </button>
            <button
              onClick={() => setActiveTab("slots")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "slots"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Manage Slots ({slots.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Pending Approval
              </p>
              <p className="text-3xl font-extrabold text-amber-600 mt-1">
                {counts.pending}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Approved Visits
              </p>
              <p className="text-3xl font-extrabold text-teal-600 mt-1">
                {counts.approved}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Visits
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {counts.completed}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab 1: Appointments */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Patient Consultations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review booked patient slots and complete consultations
                </p>
              </div>
            </div>

            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-7 h-7 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading appointments...</span>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && appointments.length === 0 && (
              <div className="text-center py-14 px-4">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  No appointments yet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Patients will appear here once they book your available slots.
                </p>
              </div>
            )}

            <div className="space-y-3.5">
              {appointments.map((appt) => {
                const badge = statusBadge[appt.status] || {
                  bg: "bg-slate-100 text-slate-700",
                  label: appt.status,
                };

                return (
                  <div
                    key={appt._id}
                    className="p-5 rounded-2xl border border-slate-200/80 hover:border-teal-200/80 bg-slate-50/50 hover:bg-white transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-100 to-teal-100 text-teal-800 font-bold text-base flex items-center justify-center flex-shrink-0 border border-teal-200/60 shadow-2xs">
                        {appt.patient?.name?.[0]?.toUpperCase() || "P"}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          {appt.patient?.name}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                          {appt.patient?.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {appt.patient.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            {appt.slot?.date?.slice(0, 10)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            {appt.slot?.startTime} – {appt.slot?.endTime}
                          </span>
                        </div>

                        {appt.reason && (
                          <p className="mt-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/70 inline-block font-medium">
                            <strong className="text-slate-700">Patient Note:</strong>{" "}
                            {appt.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start lg:self-center">
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-xl border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>

                      {appt.status === "approved" && (
                        <button
                          onClick={() => handleComplete(appt._id)}
                          disabled={updatingId === appt._id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 active:scale-98 disabled:opacity-60"
                        >
                          {updatingId === appt._id ? (
                            <span>Updating...</span>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Complete Visit</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create & Manage Slots */}
        {activeTab === "slots" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create Slot Form */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Create Availability Slot
                </h3>
              </div>

              {slotSuccess && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{slotSuccess}</span>
                </div>
              )}

              {slotError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{slotError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={slotForm.date}
                    onChange={(e) =>
                      setSlotForm({ ...slotForm, date: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={slotForm.startTime}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, startTime: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={slotForm.endTime}
                      onChange={(e) =>
                        setSlotForm({ ...slotForm, endTime: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={slotCreating}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                >
                  {slotCreating ? (
                    <span>Creating Slot...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add Slot to Schedule</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Existing Slots List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 lg:p-7">
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Your Scheduled Slots
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                Available slots are visible to patients searching for appointments
              </p>

              {slotsLoading && (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <div className="w-6 h-6 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                  <span className="text-xs font-medium">Loading slots...</span>
                </div>
              )}

              {!slotsLoading && slots.length === 0 && (
                <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    No open slots
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Use the form on the left to publish slots for patients.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <div
                    key={slot._id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>{slot.date?.slice(0, 10)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        slot.isBooked
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-teal-50 text-teal-700 border-teal-200"
                      }`}
                    >
                      {slot.isBooked ? "Booked" : "Available"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}