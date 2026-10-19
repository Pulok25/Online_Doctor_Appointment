import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  ShieldCheck,
  Check,
  X,
  Clock,
  AlertCircle,
  Award,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
  Ban,
  UserMinus,
  UserCheck,
  ShieldAlert,
  Calendar,
  CalendarClock,
  Edit3,
  Stethoscope,
  Filter,
} from "lucide-react";

export default function AdminApplications() {
  // Top-level section: 'appointments' or 'doctorApplications'
  const [activeSection, setActiveSection] = useState("appointments");

  // Patient Appointments state
  const [appointments, setAppointments] = useState([]);
  const [apptStatus, setApptStatus] = useState("pending");
  const [apptLoading, setApptLoading] = useState(true);

  // Doctor Applications state
  const [applications, setApplications] = useState([]);
  const [docStatus, setDocStatus] = useState("pending");
  const [docLoading, setDocLoading] = useState(true);

  // Common notification & action state
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actingId, setActingId] = useState(null);

  // Reschedule Slot Modal state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
  });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Fetch Appointments
  const fetchAppointments = async () => {
    setApptLoading(true);
    try {
      const res = await axiosInstance.get(
        `/appointments?status=${apptStatus === "all" ? "all" : apptStatus}`
      );
      setAppointments(res.data.payload.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient appointments");
    } finally {
      setApptLoading(false);
    }
  };

  // Fetch Doctor Applications
  const fetchDoctorApplications = async () => {
    setDocLoading(true);
    try {
      const res = await axiosInstance.get(
        `/doctors/applications?status=${docStatus}`
      );
      setApplications(res.data.payload.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctor applications");
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [apptStatus]);

  useEffect(() => {
    fetchDoctorApplications();
  }, [docStatus]);

  // Appointment actions: Approve, Cancel
  const handleApproveAppointment = async (id) => {
    setActingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await axiosInstance.patch(`/appointments/${id}/approve`);
      setSuccessMsg("Patient appointment approved successfully!");
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to approve appointment");
    } finally {
      setActingId(null);
    }
  };

  const handleCancelAppointment = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment and free the slot?"
    );
    if (!confirmed) return;

    setActingId(id);
    setError("");
    setSuccessMsg("");
    try {
      await axiosInstance.patch(`/appointments/${id}/cancel`);
      setSuccessMsg("Appointment cancelled by admin and slot released.");
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel appointment");
    } finally {
      setActingId(null);
    }
  };

  // Reschedule Slot Modal Open
  const openRescheduleModal = (appt) => {
    const slotDate = appt.slot?.date
      ? new Date(appt.slot.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    setRescheduleModalAppt(appt);
    setRescheduleForm({
      date: slotDate,
      startTime: appt.slot?.startTime || "09:00",
      endTime: appt.slot?.endTime || "09:30",
    });
  };

  const closeRescheduleModal = () => {
    setRescheduleModalAppt(null);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!rescheduleModalAppt) return;

    setRescheduleLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await axiosInstance.patch(
        `/appointments/${rescheduleModalAppt._id}/reschedule`,
        rescheduleForm
      );
      setSuccessMsg("Doctor slot and patient appointment successfully updated!");
      closeRescheduleModal();
      await fetchAppointments();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reschedule slot");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Doctor Application actions (Approve, Reject, Remove, Ban/Unban)
  const handleDoctorAction = async (id, action) => {
    if (action === "remove") {
      const confirmed = window.confirm(
        "Are you sure you want to REMOVE this doctor? Their role will revert to Patient and unbooked slots will be cleared."
      );
      if (!confirmed) return;
    }

    if (action === "toggle-ban") {
      const confirmed = window.confirm(
        "Are you sure you want to change the BAN status of this account?"
      );
      if (!confirmed) return;
    }

    setActingId(id);
    setError("");
    setSuccessMsg("");

    try {
      const res = await axiosInstance.patch(`/doctors/${id}/${action}`);
      setSuccessMsg(res.data.message || `Action ${action} succeeded.`);
      await fetchDoctorApplications();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} doctor`);
    } finally {
      setActingId(null);
    }
  };

  const apptStatusBadge = {
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      label: "Pending Admin Approval",
      icon: Clock,
    },
    approved: {
      bg: "bg-sky-50 text-sky-700 border-sky-200/80",
      label: "Approved & Scheduled",
      icon: CheckCircle2,
    },
    completed: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      label: "Visit Completed",
      icon: CheckCircle2,
    },
    cancelled: {
      bg: "bg-rose-50 text-rose-700 border-rose-200/80",
      label: "Cancelled",
      icon: AlertCircle,
    },
  };

  return (
    <div className="min-h-screen bg-slate-50/70 medical-bg-mesh pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hospital Operations & Approvals
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Approve patient bookings, reschedule absent doctor slots, and verify physician licenses
            </p>
          </div>

          {/* Master View Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl self-start md:self-auto border border-slate-200/70">
            <button
              onClick={() => setActiveSection("appointments")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeSection === "appointments"
                  ? "bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Patient Appointments</span>
            </button>
            <button
              onClick={() => setActiveSection("doctorApplications")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeSection === "doctorApplications"
                  ? "bg-white text-purple-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-4 h-4 text-purple-600" />
              <span>Doctor Verification</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Success / Error Banners */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 mb-6 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================
            SECTION 1: PATIENT APPOINTMENTS & SLOT RESCHEDULING
           ======================================================== */}
        {activeSection === "appointments" && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Patient Booking Approvals & Slot Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve appointments or update doctor slots if a doctor is absent
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "pending", label: "Pending Approval" },
                  { id: "approved", label: "Approved" },
                  { id: "completed", label: "Completed" },
                  { id: "cancelled", label: "Cancelled" },
                  { id: "all", label: "All" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setApptStatus(tab.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      apptStatus === tab.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {apptLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-8 h-8 border-3 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-xs font-medium">Fetching patient appointments...</span>
              </div>
            )}

            {!apptLoading && appointments.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  No {apptStatus} appointments
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  There are currently no patient records matching this filter.
                </p>
              </div>
            )}

            {/* Appointment Cards */}
            <div className="space-y-3.5">
              {appointments.map((appt) => {
                const badge = apptStatusBadge[appt.status] || {
                  bg: "bg-slate-100 text-slate-700",
                  label: appt.status,
                  icon: Clock,
                };
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={appt._id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-200/80 shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    {/* Patient & Doctor Details */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-100 to-teal-100 text-teal-800 font-bold text-base flex items-center justify-center flex-shrink-0 border border-teal-200/60 shadow-2xs">
                        {appt.patient?.name?.[0]?.toUpperCase() || "P"}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-base">
                            Patient: {appt.patient?.name}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100 font-semibold">
                            Doctor: Dr. {appt.doctor?.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                          {appt.patient?.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {appt.patient.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" />
                            {appt.slot?.date?.slice(0, 10)}
                          </span>
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            {appt.slot?.startTime} – {appt.slot?.endTime}
                          </span>
                        </div>

                        {appt.reason && (
                          <p className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 inline-block font-medium">
                            <strong>Reason:</strong> {appt.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 w-full lg:w-auto justify-end">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        <span>{badge.label}</span>
                      </span>

                      {/* If pending: Show Approve button */}
                      {appt.status === "pending" && (
                        <button
                          onClick={() => handleApproveAppointment(appt._id)}
                          disabled={actingId === appt._id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-60"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {actingId === appt._id ? "Approving..." : "Approve Booking"}
                          </span>
                        </button>
                      )}

                      {/* Reschedule Slot Button: Available for pending or approved */}
                      {(appt.status === "pending" || appt.status === "approved") && (
                        <button
                          onClick={() => openRescheduleModal(appt)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all active:scale-98"
                          title="Doctor absent? Change slot date & time"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-teal-600" />
                          <span>Update / Reschedule Slot</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {(appt.status === "pending" || appt.status === "approved") && (
                        <button
                          onClick={() => handleCancelAppointment(appt._id)}
                          disabled={actingId === appt._id}
                          className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all active:scale-98"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            SECTION 2: DOCTOR CREDENTIAL APPLICATIONS
           ======================================================== */}
        {activeSection === "doctorApplications" && (
          <div className="space-y-6">
            {/* Status Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Doctor Applications & Accreditation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify BMDC registration, license approval, or ban/remove accounts
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: "pending", label: "Pending Review", icon: Clock },
                  { id: "approved", label: "Approved Doctors", icon: CheckCircle2 },
                  { id: "rejected", label: "Rejected / Inactive", icon: AlertCircle },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDocStatus(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        docStatus === tab.id
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {docLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-8 h-8 border-3 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-xs font-medium">Fetching doctor records...</span>
              </div>
            )}

            {!docLoading && applications.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">
                  No {docStatus} doctors
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  There are currently no doctor profiles with {docStatus} status.
                </p>
              </div>
            )}

            {/* Doctor Application Cards List */}
            <div className="space-y-4">
              {applications.map((app) => {
                const isUserBanned = app.user?.isBanned;

                return (
                  <div
                    key={app._id}
                    className={`bg-white rounded-2xl border p-6 transition-all shadow-xs ${
                      isUserBanned
                        ? "border-rose-300 bg-rose-50/20"
                        : "border-slate-200/80 hover:border-teal-200/80"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        {app.image ? (
                          <img
                            src={`http://localhost:3001/${app.image}`}
                            alt={app.user?.name}
                            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-teal-100 flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-2xl font-bold text-lg flex items-center justify-center flex-shrink-0 border shadow-2xs ${
                              isUserBanned
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-gradient-to-tr from-purple-100 to-teal-100 text-teal-800 border-teal-200/60"
                            }`}
                          >
                            {app.user?.name?.[0]?.toUpperCase() || "D"}
                          </div>
                        )}

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-base">
                              Dr. {app.user?.name}
                            </h3>
                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                              {app.specialization}
                            </span>

                            {isUserBanned && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                <ShieldAlert className="w-3 h-3 text-rose-600" />
                                Account Banned
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              {app.user?.email}
                            </span>
                            {app.user?.phone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {app.user.phone}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <Award className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                <strong>Degrees:</strong> {app.qualification}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                              <span>
                                <strong>BMDC:</strong> {app.bmdcNumber}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <span>
                                <strong>Fee:</strong> ৳{app.fee} ({app.experienceYears}y exp)
                              </span>
                            </div>
                          </div>

                          {app.bio && (
                            <p className="pt-2 text-xs text-slate-500 italic">
                              "{app.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Doctor Actions */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-center border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto justify-end">
                        {docStatus === "pending" && (
                          <>
                            <button
                              onClick={() => handleDoctorAction(app._id, "approve")}
                              disabled={actingId === app._id}
                              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-60"
                            >
                              <Check className="w-4 h-4" />
                              <span>
                                {actingId === app._id ? "Processing..." : "Approve & Upgrade"}
                              </span>
                            </button>

                            <button
                              onClick={() => handleDoctorAction(app._id, "reject")}
                              disabled={actingId === app._id}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {docStatus === "approved" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active Doctor
                            </span>

                            <button
                              onClick={() => handleDoctorAction(app._id, "remove")}
                              disabled={actingId === app._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              <span>Remove Doctor</span>
                            </button>

                            <button
                              onClick={() => handleDoctorAction(app._id, "toggle-ban")}
                              disabled={actingId === app._id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60 ${
                                isUserBanned
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                              }`}
                            >
                              {isUserBanned ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Unban Account</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Ban Account</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {docStatus === "rejected" && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                              Inactive / Rejected
                            </span>

                            <button
                              onClick={() => handleDoctorAction(app._id, "approve")}
                              disabled={actingId === app._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Re-Approve</span>
                            </button>

                            <button
                              onClick={() => handleDoctorAction(app._id, "toggle-ban")}
                              disabled={actingId === app._id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60 ${
                                isUserBanned
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                                  : "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {isUserBanned ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Unban</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Ban User</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          RESCHEDULE / UPDATE SLOT MODAL FOR ABSENT DOCTORS
         ======================================================== */}
      {rescheduleModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight">
                    Update / Reschedule Slot
                  </h3>
                  <p className="text-xs text-teal-700">
                    Dr. {rescheduleModalAppt.doctor?.name} · Patient: {rescheduleModalAppt.patient?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={closeRescheduleModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <strong>Doctor absent or rescheduling needed?</strong> Select a new date and time for this doctor's slot. The patient's appointment will be updated automatically.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Appointment Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleForm.date}
                  onChange={(e) =>
                    setRescheduleForm({ ...rescheduleForm, date: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleForm.startTime}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={rescheduleForm.endTime}
                    onChange={(e) =>
                      setRescheduleForm({
                        ...rescheduleForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeRescheduleModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleLoading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 flex items-center gap-1.5 active:scale-98 disabled:opacity-60"
                >
                  {rescheduleLoading ? (
                    <span>Updating Slot...</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Update Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}