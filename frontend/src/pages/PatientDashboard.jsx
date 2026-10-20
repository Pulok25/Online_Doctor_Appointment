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
  CreditCard,
  FileText,
  Download,
  Eye,
  Receipt,
  Check,
  X,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  // Payment Demo Modal state
  const [payModalAppt, setPayModalAppt] = useState(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState("");
  const [payError, setPayError] = useState("");

  // Prescription View Modal state
  const [viewPrescriptionModal, setViewPrescriptionModal] = useState(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

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

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Payment action
  const openPayModal = (appt) => {
    setPayModalAppt(appt);
    setPayError("");
    setPaySuccessMsg("");
  };

  const closePayModal = () => {
    setPayModalAppt(null);
    setPayError("");
  };

  const handleConfirmPayment = async () => {
    if (!payModalAppt) return;
    setPaySubmitting(true);
    setPayError("");
    try {
      await axiosInstance.patch(`/appointments/${payModalAppt._id}/pay`);
      setPaySuccessMsg("Payment confirmed successfully! Your official invoice receipt is now available.");
      await fetchAppointments();
      setTimeout(() => {
        setPayModalAppt(null);
        setPaySuccessMsg("");
      }, 1600);
    } catch (err) {
      setPayError(err.response?.data?.message || "Failed to process payment");
    } finally {
      setPaySubmitting(false);
    }
  };

  // Download Invoice PDF
  const handleDownloadInvoice = async (appointmentId, invoiceNumber) => {
    setDownloadingId(`inv-${appointmentId}`);
    try {
      const res = await axiosInstance.get(
        `/appointments/${appointmentId}/invoice`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${invoiceNumber || appointmentId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      let errMsg = "Failed to download invoice receipt";
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
    } finally {
      setDownloadingId(null);
    }
  };

  // Download Prescription PDF
  const handleDownloadPrescription = async (appointmentId) => {
    setDownloadingId(`rx-${appointmentId}`);
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
      let errMsg = "Failed to download prescription document";
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
    } finally {
      setDownloadingId(null);
    }
  };

  // View Prescription
  const handleViewPrescription = async (appointmentId) => {
    setPrescriptionLoading(true);
    try {
      const res = await axiosInstance.get(
        `/prescriptions/appointment/${appointmentId}`
      );
      setViewPrescriptionModal(res.data.payload);
    } catch (err) {
      alert(
        err.response?.data?.message || "Prescription details not available yet"
      );
    } finally {
      setPrescriptionLoading(false);
    }
  };

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

                  <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize ${statusCfg.bg}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusCfg.label}
                    </span>

                    {/* Pending state */}
                    {appt.status === "pending" && (
                      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline-block">
                        Awaiting clinic approval
                      </span>
                    )}

                    {/* Approved & Unpaid: Proceed to Pay */}
                    {appt.status === "approved" && appt.paymentStatus !== "paid" && (
                      <button
                        onClick={() => openPayModal(appt)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20 active:scale-98"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Pay ৳{appt.invoiceAmount || 500} (Demo)</span>
                      </button>
                    )}

                    {/* Paid Badge & Invoice Receipt Download */}
                    {appt.paymentStatus === "paid" && (
                      <button
                        onClick={() =>
                          handleDownloadInvoice(appt._id, appt.invoiceNumber)
                        }
                        disabled={downloadingId === `inv-${appt._id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-xs font-semibold transition-all active:scale-98 disabled:opacity-60"
                        title="Download Official Invoice Receipt"
                      >
                        <Receipt className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {downloadingId === `inv-${appt._id}`
                            ? "Downloading..."
                            : "Invoice PDF"}
                        </span>
                      </button>
                    )}

                    {/* Completed: View Prescription & Download Medical Report */}
                    {appt.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewPrescription(appt._id)}
                          disabled={prescriptionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
                          title="View Doctor Prescription"
                        >
                          <Eye className="w-3.5 h-3.5 text-teal-600" />
                          <span>View Rx</span>
                        </button>
                        <button
                          onClick={() => handleDownloadPrescription(appt._id)}
                          disabled={downloadingId === `rx-${appt._id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20"
                          title="Download Official Prescription PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {downloadingId === `rx-${appt._id}`
                              ? "Downloading..."
                              : "Prescription PDF"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ========================================================
          MODAL 1: DEMO INVOICE PAYMENT CONFIRMATION
         ======================================================== */}
      {payModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-2xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Consultation Payment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instant Demo Payment Gateway
                  </p>
                </div>
              </div>
              <button
                onClick={closePayModal}
                disabled={paySubmitting}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error or Success Notice */}
            {payError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{payError}</span>
              </div>
            )}
            {paySuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{paySuccessMsg}</span>
              </div>
            )}

            {/* Invoice Summary */}
            <div className="mt-5 space-y-3.5">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Doctor:</span>
                  <strong className="text-slate-900 font-semibold">
                    Dr. {payModalAppt.doctor?.name}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Date & Slot:</span>
                  <span className="text-slate-700 font-medium">
                    {payModalAppt.slot?.date?.slice(0, 10)} ({payModalAppt.slot?.startTime} - {payModalAppt.slot?.endTime})
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Invoice Number:</span>
                  <span className="text-slate-700 font-mono text-[11px]">
                    {payModalAppt.invoiceNumber || "INV-NEW"}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">Total Payable:</span>
                  <span className="font-extrabold text-teal-600 text-base">
                    ৳{payModalAppt.invoiceAmount || 500} BDT
                  </span>
                </div>
              </div>

              {/* Sandbox notice */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-800">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block text-emerald-900 mb-0.5">
                    Demo Mode Enabled
                  </strong>
                  Clicking "Confirm Payment" instantly verifies this invoice and unlocks your downloadable PDF receipt. (Payment gateway integration will connect here in production).
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={closePayModal}
                disabled={paySubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={paySubmitting || !!paySuccessMsg}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm shadow-teal-600/20 transition-all active:scale-98 disabled:opacity-60"
              >
                {paySubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Pay ৳{payModalAppt.invoiceAmount || 500}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: VIEW PRESCRIPTION
         ======================================================== */}
      {viewPrescriptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold mb-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Clinical Prescription</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  Doctor's e-Prescription
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Doctor: <strong className="text-slate-700">Dr. {viewPrescriptionModal.doctor?.name}</strong>
                  {viewPrescriptionModal.patientAge && ` · Patient Age: ${viewPrescriptionModal.patientAge}`}
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
              {/* Diagnosis */}
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  Diagnosis / Clinical Findings
                </span>
                <p className="text-xs text-slate-800 font-medium">
                  {viewPrescriptionModal.diagnosis}
                </p>
              </div>

              {/* Medicines Table */}
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-teal-600" />
                  <span>Prescribed Medicines (Rx)</span>
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

              {/* Recommended Diagnostic Tests */}
              {viewPrescriptionModal.tests && viewPrescriptionModal.tests.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Recommended Tests / পরীক্ষা সমূহ</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-medium">
                    {viewPrescriptionModal.tests.map((testItem, i) => (
                      <li key={i}>{testItem}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advice */}
              {viewPrescriptionModal.notes && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Doctor's Advice & Instructions
                  </span>
                  <p className="text-xs text-slate-600">
                    {viewPrescriptionModal.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-5 mt-5 border-t border-slate-100">
              <button
                onClick={() =>
                  handleDownloadPrescription(viewPrescriptionModal.appointment)
                }
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm shadow-teal-600/20"
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