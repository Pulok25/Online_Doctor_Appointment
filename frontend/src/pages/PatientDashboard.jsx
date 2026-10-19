import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Plus,
  ArrowRight,
  HeartPulse,
  Filter,
} from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axiosInstance.get("/appointments/myappointment");
        setAppointments(res.data.payload.appointments || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const statusBadge = {
    pending: {
      bg: "bg-amber-50 text-amber-700 border-amber-200/80",
      label: "Pending Approval",
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

  const counts = {
    upcoming: appointments.filter(
      (a) => a.status === "pending" || a.status === "approved"
    ).length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (filterTab === "all") return true;
    if (filterTab === "upcoming")
      return appt.status === "pending" || appt.status === "approved";
    if (filterTab === "completed") return appt.status === "completed";
    if (filterTab === "cancelled") return appt.status === "cancelled";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50/70 medical-bg-mesh pb-20">
      {/* Top Welcome Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 mb-2 inline-block">
              Patient Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || "Patient"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your upcoming clinical appointments and healthcare history
            </p>
          </motion.div>

          <div className="flex flex-wrap gap-2.5">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/doctors"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-teal-600/20 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" />
                Book New Appointment
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/apply-doctor"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Join as Doctor
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Animated Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Upcoming & Pending
              </p>
              <p className="text-3xl font-extrabold text-teal-600 mt-1">
                {counts.upcoming}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Visits
              </p>
              <p className="text-3xl font-extrabold text-emerald-600 mt-1">
                {counts.completed}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ y: -4 }}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cancelled
              </p>
              <p className="text-3xl font-extrabold text-slate-700 mt-1">
                {counts.cancelled}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* Appointments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                My Appointments
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed record of scheduled clinical visits
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {[
                { id: "all", label: "All" },
                { id: "upcoming", label: "Upcoming" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filterTab === tab.id
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-7 h-7 border-2 border-teal-600/20 border-t-teal-600 rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading your appointments...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && filteredAppointments.length === 0 && (
            <div className="text-center py-14 px-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">
                No appointments found
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
                {filterTab === "all"
                  ? "You haven't scheduled any doctor consultations yet."
                  : `You have no ${filterTab} appointments.`}
              </p>
              <Link
                to="/doctors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Find an Available Doctor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="space-y-3.5">
            {filteredAppointments.map((appt, idx) => {
              const statusCfg = statusBadge[appt.status] || {
                bg: "bg-slate-100 text-slate-700 border-slate-200",
                label: appt.status,
                icon: Clock,
              };
              const StatusIcon = statusCfg.icon;

              return (
                <motion.div
                  key={appt._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className="p-5 rounded-2xl border border-slate-200/80 hover:border-teal-200/80 bg-slate-50/50 hover:bg-white transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 font-bold text-base flex items-center justify-center flex-shrink-0 border border-teal-200/60 shadow-2xs">
                      {appt.doctor?.name?.[0]?.toUpperCase() || "D"}
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Dr. {appt.doctor?.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {appt.slot?.date?.slice(0, 10) || "Scheduled"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {appt.slot?.startTime} – {appt.slot?.endTime}
                        </span>
                      </div>

                      {appt.reason && (
                        <p className="mt-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200/70 inline-block font-medium">
                          <strong className="text-slate-700">Reason:</strong> {appt.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize ${statusCfg.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}