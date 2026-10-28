import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance, { BACKEND_URL } from "../api/axiosInstance";
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
  FileText,
  Download,
  Trash2,
  X,
  Eye,
  Pill,
  CreditCard,
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

  // Prescription creation modal state
  const [prescriptionModalAppt, setPrescriptionModalAppt] = useState(null);
  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: "",
    patientAge: "",
    patientGender: "Male",
    medicines: [{ name: "", dosage: "", duration: "" }],
    tests: [""],
    notes: "",
  });
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);
  const [prescriptionError, setPrescriptionError] = useState("");

  // View prescription modal state
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

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

  // Edit / Reschedule slot state
  const [editSlotModal, setEditSlotModal] = useState(null);
  const [editSlotForm, setEditSlotForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    isBooked: false,
  });
  const [editSlotSubmitting, setEditSlotSubmitting] = useState(false);
  const [editSlotError, setEditSlotError] = useState("");

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
      setAppointments(res.data.payload.appointments || []);
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
      setSlots(res.data.payload.slots || []);
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

  // Prescription modal triggers
  const openPrescribeModal = (appt) => {
    setPrescriptionModalAppt(appt);
    setPrescriptionForm({
      diagnosis: "",
      medicines: [{ name: "", dosage: "", duration: "" }],
      notes: "",
    });
    setPrescriptionError("");
  };

  const closePrescribeModal = () => {
    setPrescriptionModalAppt(null);
    setPrescriptionError("");
  };

  const handleAddMedicine = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: [...prev.medicines, { name: "", dosage: "", duration: "" }],
    }));
  };

  const handleRemoveMedicine = (index) => {
    if (prescriptionForm.medicines.length <= 1) return;
    setPrescriptionForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index),
    }));
  };

  const handleMedicineChange = (index, field, value) => {
    setPrescriptionForm((prev) => {
      const updated = [...prev.medicines];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medicines: updated };
    });
  };

  const handleAddTest = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      tests: [...(prev.tests || []), ""],
    }));
  };

  const handleRemoveTest = (index) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      tests: (prev.tests || []).filter((_, i) => i !== index),
    }));
  };

  const handleTestChange = (index, value) => {
    setPrescriptionForm((prev) => {
      const updated = [...(prev.tests || [])];
      updated[index] = value;
      return { ...prev, tests: updated };
    });
  };

  const handleSubmitPrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.diagnosis.trim()) {
      setPrescriptionError("Clinical diagnosis is required");
      return;
    }
    for (const med of prescriptionForm.medicines) {
      if (!med.name.trim() || !med.dosage.trim() || !med.duration.trim()) {
        setPrescriptionError("Please fill out name, dosage, and duration for each prescribed medicine");
        return;
      }
    }

    setPrescriptionSubmitting(true);
    setPrescriptionError("");

    try {
      await axiosInstance.post("/prescriptions", {
        appointmentId: prescriptionModalAppt._id,
        diagnosis: prescriptionForm.diagnosis,
        patientAge: prescriptionForm.patientAge,
        patientGender: prescriptionForm.patientGender,
        medicines: prescriptionForm.medicines,
        tests: (prescriptionForm.tests || []).filter((t) => t.trim()),
        notes: prescriptionForm.notes,
      });
      setPrescriptionModalAppt(null);
      await fetchAppointments();
    } catch (err) {
      setPrescriptionError(
        err.response?.data?.message || "Failed to save prescription"
      );
    } finally {
      setPrescriptionSubmitting(false);
    }
  };

  const handleDownloadPrescription = async (appointmentId) => {
    try {
      const res = await axiosInstance.get(
        `/prescriptions/${appointmentId}/download`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Prescription-${appointmentId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let errMsg = "Failed to download prescription PDF";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.message) errMsg = parsed.message;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      alert(errMsg);
    }
  };

  const handleViewPrescription = async (appointmentId) => {
    setViewLoading(true);
    try {
      const res = await axiosInstance.get(
        `/prescriptions/appointment/${appointmentId}`
      );
      setViewPrescriptionModal(res.data.payload);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fetch prescription details");
    } finally {
      setViewLoading(false);
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

  const handleMarkCompleted = async (appointmentId) => {
    setUpdatingId(appointmentId);
    try {
      await axiosInstance.patch(`/appointments/${appointmentId}/status`, {
        status: "completed",
      });
      await fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark appointment as completed");
    } finally {
      setUpdatingId(null);
    }
  };

  const isSlotActivelyBooked = (slotId) => {
    return appointments.some(
      (a) =>
        (a.slot?._id === slotId || a.slot === slotId) &&
        ["pending", "approved"].includes(a.status)
    );
  };

  const handleOpenEditSlot = (slot) => {
    if (isSlotActivelyBooked(slot._id)) {
      alert("Cannot modify or reschedule a slot with an active booking (pending or approved).");
      return;
    }
    setEditSlotModal(slot);
    setEditSlotForm({
      date: slot.date ? slot.date.slice(0, 10) : "",
      startTime: slot.startTime || "",
      endTime: slot.endTime || "",
      isBooked: !!slot.isBooked,
    });
    setEditSlotError("");
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!editSlotModal) return;
    setEditSlotSubmitting(true);
    setEditSlotError("");
    try {
      await axiosInstance.patch(`/slots/${editSlotModal._id}`, {
        date: editSlotForm.date,
        startTime: editSlotForm.startTime,
        endTime: editSlotForm.endTime,
        isBooked: editSlotForm.isBooked,
      });
      setEditSlotModal(null);
      await fetchMySlots();
    } catch (err) {
      setEditSlotError(err.response?.data?.message || "Failed to update slot");
    } finally {
      setEditSlotSubmitting(false);
    }
  };

  const handleToggleAvailability = async (slot) => {
    if (isSlotActivelyBooked(slot._id)) {
      alert("Cannot alter availability of a slot with an active booking in progress.");
      return;
    }
    try {
      await axiosInstance.patch(`/slots/${slot._id}`, {
        isBooked: !slot.isBooked,
      });
      await fetchMySlots();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle slot availability");
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (isSlotActivelyBooked(slotId)) {
      alert("Cannot delete a slot with an active booking in progress.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this slot?")) return;
    try {
      await axiosInstance.delete(`/slots/${slotId}`);
      await fetchMySlots();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete slot");
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

  const doctorPhotoUrl = profile?.image ? `${BACKEND_URL}/${profile.image}` : null;

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

                    <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
                      <span
                        className={`inline-block text-xs font-semibold px-3 py-1.5 rounded-xl border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>

                      {/* Payment Status indicator */}
                      {appt.invoiceAmount && (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${
                            appt.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>
                            {appt.paymentStatus === "paid"
                              ? `Paid ৳${appt.invoiceAmount}`
                              : `Unpaid ৳${appt.invoiceAmount}`}
                          </span>
                        </span>
                      )}

                      {/* Approved: Write Prescription & Complete Visit */}
                      {appt.status === "approved" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openPrescribeModal(appt)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 active:scale-98"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Prescribe & Complete</span>
                          </button>
                          <button
                            onClick={() => handleMarkCompleted(appt._id)}
                            disabled={updatingId === appt._id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60"
                            title="Mark consultation as completed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{updatingId === appt._id ? "Completing..." : "Complete"}</span>
                          </button>
                        </div>
                      )}

                      {/* Completed: View Prescription & Download PDF */}
                      {appt.status === "completed" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewPrescription(appt._id)}
                            disabled={viewLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                            title="View e-Prescription"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            <span>View Rx</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPrescription(appt._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl text-xs font-semibold transition-all"
                            title="Download Medical Report PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
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
                {slots.map((slot) => {
                  const activelyBooked = isSlotActivelyBooked(slot._id);
                  return (
                    <div
                      key={slot._id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{slot.date?.slice(0, 10)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span
                            className={"text-[10px] font-semibold px-2 py-0.5 rounded-full border " + (
                              activelyBooked
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : slot.isBooked
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-teal-50 text-teal-700 border-teal-200"
                            )}
                          >
                            {activelyBooked ? "Active Booking" : slot.isBooked ? "Booked / Closed" : "Available"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {!activelyBooked && (
                          <>
                            <button
                              onClick={() => handleToggleAvailability(slot)}
                              className={"px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all " + (
                                slot.isBooked
                                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                              )}
                              title={slot.isBooked ? "Make slot available for patients" : "Mark slot closed"}
                            >
                              {slot.isBooked ? "Reopen" : "Close"}
                            </button>
                            <button
                              onClick={() => handleOpenEditSlot(slot)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 transition-all"
                              title="Reschedule slot date or time"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {activelyBooked && (
                          <span className="text-[11px] text-slate-400 italic">Locked (Active)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: RESCHEDULE / EDIT SLOT */}
      {editSlotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Reschedule Slot Time
              </h3>
              <button
                onClick={() => setEditSlotModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editSlotError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editSlotError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSlot} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={editSlotForm.date}
                  onChange={(e) =>
                    setEditSlotForm({ ...editSlotForm, date: e.target.value })
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
                    value={editSlotForm.startTime}
                    onChange={(e) =>
                      setEditSlotForm({ ...editSlotForm, startTime: e.target.value })
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
                    value={editSlotForm.endTime}
                    onChange={(e) =>
                      setEditSlotForm({ ...editSlotForm, endTime: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slot-booked-check"
                  checked={!editSlotForm.isBooked}
                  onChange={(e) =>
                    setEditSlotForm({ ...editSlotForm, isBooked: !e.target.checked })
                  }
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <label htmlFor="slot-booked-check" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Available for booking by patients
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditSlotModal(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSlotSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-60"
                >
                  {editSlotSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: WRITE PRESCRIPTION & COMPLETE VISIT
         ======================================================== */}
      {prescriptionModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Clinical Prescription</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Prescribe & Complete Consultation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong className="text-slate-700">{prescriptionModalAppt.patient?.name}</strong> · Slot: {prescriptionModalAppt.slot?.date?.slice(0, 10)} ({prescriptionModalAppt.slot?.startTime} - {prescriptionModalAppt.slot?.endTime})
                </p>
              </div>
              <button
                onClick={closePrescribeModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prescriptionModalAppt.reason && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong className="text-slate-700">Patient Note:</strong> {prescriptionModalAppt.reason}
              </div>
            )}

            {prescriptionError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{prescriptionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitPrescription} className="mt-5 space-y-5">
              {/* Patient Demographics: Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Age (রোগীর বয়স)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 28 Years / ২৮ বছর"
                    value={prescriptionForm.patientAge}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        patientAge: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Patient Gender (লিঙ্গ)
                  </label>
                  <select
                    value={prescriptionForm.patientGender}
                    onChange={(e) =>
                      setPrescriptionForm({
                        ...prescriptionForm,
                        patientGender: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs text-slate-900 bg-white"
                  >
                    <option value="Male">Male (পুরুষ)</option>
                    <option value="Female">Female (মহিলা)</option>
                    <option value="Other">Other (অন্যান্য)</option>
                  </select>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Diagnosis / Clinical Findings <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Upper Respiratory Tract Infection, Seasonal Allergic Rhinitis"
                  value={prescriptionForm.diagnosis}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      diagnosis: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs text-slate-900 bg-slate-50/50"
                />
              </div>

              {/* Medicines Dynamic List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Prescribed Medicines (Rx)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {prescriptionForm.medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-2"
                    >
                      <input
                        type="text"
                        required
                        placeholder="Medicine name (e.g. Napa Extra 500mg)"
                        value={med.name}
                        onChange={(e) =>
                          handleMedicineChange(idx, "name", e.target.value)
                        }
                        className="w-full sm:flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white text-slate-900"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Dosage (e.g. 1+0+1 after meals)"
                        value={med.dosage}
                        onChange={(e) =>
                          handleMedicineChange(idx, "dosage", e.target.value)
                        }
                        className="w-full sm:w-44 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white text-slate-900"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Duration (e.g. 5 days)"
                        value={med.duration}
                        onChange={(e) =>
                          handleMedicineChange(idx, "duration", e.target.value)
                        }
                        className="w-full sm:w-28 px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-white text-slate-900"
                      />
                      {prescriptionForm.medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors self-end sm:self-center"
                          title="Remove medicine"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Diagnostic Tests / Investigations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Recommended Tests / পরীক্ষা সমূহ (Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTest}
                    className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Test</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(prescriptionForm.tests || []).map((testItem, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. CBC, Serum Creatinine, X-Ray Chest PA View, RBS"
                        value={testItem}
                        onChange={(e) => handleTestChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs bg-slate-50/50 text-slate-900"
                      />
                      {prescriptionForm.tests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove test"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advice / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Advice & Clinical Instructions (পরামর্শ)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Drink plenty of warm water, take rest, revisit in 7 days if symptoms persist."
                  value={prescriptionForm.notes}
                  onChange={(e) =>
                    setPrescriptionForm({
                      ...prescriptionForm,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs text-slate-900 bg-slate-50/50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closePrescribeModal}
                  disabled={prescriptionSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={prescriptionSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm shadow-teal-600/20 transition-all active:scale-98 disabled:opacity-60"
                >
                  {prescriptionSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving & Completing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Prescription & Complete Visit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: VIEW COMPLETED PRESCRIPTION DETAILS
         ======================================================== */}
      {viewPrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Prescription Record</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  e-Prescription Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong className="text-slate-700">{viewPrescriptionModal.patientName || viewPrescriptionModal.patient?.name}</strong>
                  {viewPrescriptionModal.patientAge && ` · Age: ${viewPrescriptionModal.patientAge}`}
                  {viewPrescriptionModal.patientGender && ` · Gender: ${viewPrescriptionModal.patientGender}`}
                  {" · Date: " + new Date(viewPrescriptionModal.createdAt).toDateString()}
                </p>
              </div>
              <button
                onClick={() => setViewPrescriptionModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  Diagnosis
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  {viewPrescriptionModal.diagnosis}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                  Prescribed Medicines
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <div className="grid grid-cols-12 bg-slate-100 p-2.5 font-semibold text-slate-700">
                    <div className="col-span-5">Medicine</div>
                    <div className="col-span-4">Dosage</div>
                    <div className="col-span-3 text-right">Duration</div>
                  </div>
                  {viewPrescriptionModal.medicines?.map((m, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 p-2.5 border-t border-slate-100 text-slate-800"
                    >
                      <div className="col-span-5 font-medium">{m.name}</div>
                      <div className="col-span-4 text-slate-600">{m.dosage}</div>
                      <div className="col-span-3 text-right text-slate-600">{m.duration}</div>
                    </div>
                  ))}
                </div>
              </div>

              {viewPrescriptionModal.tests && viewPrescriptionModal.tests.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recommended Tests (ডায়াগনস্টিক পরীক্ষা)</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-medium">
                    {viewPrescriptionModal.tests.map((testItem, i) => (
                      <li key={i}>{testItem}</li>
                    ))}
                  </ul>
                </div>
              )}

              {viewPrescriptionModal.notes && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Doctor's Advice
                  </span>
                  <p className="text-xs text-slate-600">
                    {viewPrescriptionModal.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  handleDownloadPrescription(viewPrescriptionModal.appointment)
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Medical Report</span>
              </button>
              <button
                onClick={() => setViewPrescriptionModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}