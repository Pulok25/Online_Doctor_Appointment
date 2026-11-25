import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  X,
  Send,
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { value: "billing", label: "Billing & Payment" },
  { value: "doctor_behavior", label: "Doctor Behavior" },
  { value: "appointment", label: "Appointment Issue" },
  { value: "service_quality", label: "Service Quality" },
  { value: "prescription", label: "Prescription" },
  { value: "technical", label: "Technical Problem" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const statusMeta = {
  pending: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending Review", icon: Clock },
  in_review: { bg: "bg-sky-50 text-sky-700 border-sky-200", label: "In Review", icon: ShieldCheck },
  resolved: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Resolved", icon: CheckCircle2 },
  dismissed: { bg: "bg-slate-100 text-slate-600 border-slate-200", label: "Dismissed", icon: X },
};

const priorityMeta = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-rose-50 text-rose-700",
};

export default function PatientComplaints() {
  const { user } = useAuth();

  // View state: "list" | "new" | "detail"
  const [view, setView] = useState("list");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // For linking appointment
  const [myAppointments, setMyAppointments] = useState([]);

  // New complaint form
  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "medium",
    description: "",
    appointmentId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Detail view
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/complaints/my${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`
      );
      setComplaints(res.data.payload.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/appointments/myappointment");
      setMyAppointments(res.data.payload.appointments || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus]);

  useEffect(() => {
    if (view === "new") fetchAppointments();
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await axiosInstance.post("/complaints", {
        title: form.title,
        category: form.category,
        priority: form.priority,
        description: form.description,
        appointmentId: form.appointmentId || undefined,
      });
      setSuccessMsg("Complaint submitted successfully! We will review it shortly.");
      setForm({ title: "", category: "", priority: "medium", description: "", appointmentId: "" });
      setView("list");
      await fetchComplaints();
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit complaint");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (complaint) => {
    setDetailLoading(true);
    setView("detail");
    setReplyText("");
    setExpandedMessages(false);
    try {
      const res = await axiosInstance.get(`/complaints/${complaint._id}`);
      setSelectedComplaint(res.data.payload.complaint);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaint details");
      setView("list");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    setError("");
    try {
      const res = await axiosInstance.post(`/complaints/${selectedComplaint._id}/reply`, {
        text: replyText.trim(),
      });
      setSelectedComplaint((prev) => ({ ...prev, messages: res.data.payload.messages }));
      setReplyText("");
      await fetchComplaints();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
              <MessageSquare className="w-3.5 h-3.5" />
              Complaint Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Complaints
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Submit and track your complaints — we respond within 24–48 hours
            </p>
          </div>

          {view === "list" && (
            <button
              onClick={() => { setView("new"); setError(""); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Complaint
            </button>
          )}

          {(view === "new" || view === "detail") && (
            <button
              onClick={() => { setView("list"); setError(""); setSelectedComplaint(null); }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        {/* Banners */}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── NEW COMPLAINT FORM ── */}
        {view === "new" && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100/60 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-base">Submit New Complaint</h2>
                <p className="text-xs text-rose-700">All fields marked * are required</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={150}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief summary of your complaint"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category *
                  </label>
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    <option value="">Select category…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link Appointment (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Link to Appointment <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  value={form.appointmentId}
                  onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                >
                  <option value="">— No appointment linked —</option>
                  {myAppointments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.slot?.date?.slice(0, 10) || "Date N/A"} · Dr. {a.doctor?.name || "Unknown"} · {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description * <span className="text-slate-400 font-normal">(min 20 chars)</span>
                </label>
                <textarea
                  required
                  minLength={20}
                  maxLength={3000}
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe your complaint in detail…"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1 text-right">{form.description.length}/3000</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setView("list"); setError(""); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Submitting…" : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === "detail" && (
          <div className="space-y-5">
            {detailLoading && (
              <div className="py-20 flex flex-col items-center gap-2 text-slate-400">
                <div className="w-8 h-8 border-3 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading complaint…</span>
              </div>
            )}

            {!detailLoading && selectedComplaint && (() => {
              const meta = statusMeta[selectedComplaint.status] || statusMeta.pending;
              const StatusIcon = meta.icon;
              return (
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  {/* Card Header */}
                  <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200/60">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md border">
                            {selectedComplaint.referenceId}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${meta.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${priorityMeta[selectedComplaint.priority]}`}>
                            {selectedComplaint.priority} priority
                          </span>
                        </div>
                        <h2 className="font-bold text-slate-900 text-lg">{selectedComplaint.title}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Submitted {new Date(selectedComplaint.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Original Description */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Description</h3>
                      <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {selectedComplaint.description}
                      </p>
                    </div>

                    {/* Conversation Thread */}
                    {selectedComplaint.messages.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedMessages((v) => !v)}
                          className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 hover:text-slate-900 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          Conversation ({selectedComplaint.messages.length})
                          {expandedMessages ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedMessages && (
                          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {selectedComplaint.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                    msg.sender === "patient"
                                      ? "bg-teal-600 text-white rounded-br-sm"
                                      : "bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200"
                                  }`}
                                >
                                  <p className="font-semibold mb-0.5 opacity-70 capitalize">{msg.sender}</p>
                                  <p>{msg.text}</p>
                                  <p className="mt-1 opacity-60 text-[10px]">
                                    {new Date(msg.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {!expandedMessages && (
                          <p className="text-xs text-slate-400 italic">Click above to expand conversation</p>
                        )}
                      </div>
                    )}

                    {/* Reply Box (not for resolved/dismissed) */}
                    {selectedComplaint.status !== "resolved" && selectedComplaint.status !== "dismissed" && (
                      <form onSubmit={handleReply} className="border-t border-slate-100 pt-5">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                          Add a Reply
                        </h3>
                        <div className="flex gap-3">
                          <textarea
                            rows={3}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your reply to our team…"
                            maxLength={2000}
                            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none"
                          />
                          <button
                            type="submit"
                            disabled={replySubmitting || !replyText.trim()}
                            className="self-end flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {replySubmitting ? "Sending…" : "Send"}
                          </button>
                        </div>
                      </form>
                    )}

                    {(selectedComplaint.status === "resolved" || selectedComplaint.status === "dismissed") && (
                      <div className="border-t border-slate-100 pt-4 flex items-center gap-2 text-xs text-slate-500">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          This complaint was <strong>{selectedComplaint.status}</strong>
                          {selectedComplaint.resolvedAt && ` on ${new Date(selectedComplaint.resolvedAt).toLocaleDateString("en-GB")}`}.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── COMPLAINT LIST ── */}
        {view === "list" && (
          <div className="space-y-5">
            {/* Filter tabs */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Your Complaint History</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track all submitted complaints and admin responses</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl flex-wrap">
                {["all", "pending", "in_review", "resolved", "dismissed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                      filterStatus === s
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="py-20 flex flex-col items-center gap-2 text-slate-400">
                <div className="w-8 h-8 border-3 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
                <span className="text-xs font-medium">Loading complaints…</span>
              </div>
            )}

            {!loading && complaints.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-8 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">No complaints yet</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {filterStatus === "all" ? "You haven't submitted any complaints." : `No ${filterStatus.replace("_", " ")} complaints.`}
                </p>
                <button
                  onClick={() => { setView("new"); setError(""); }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Submit a Complaint
                </button>
              </div>
            )}

            <div className="space-y-3.5">
              {complaints.map((c) => {
                const meta = statusMeta[c.status] || statusMeta.pending;
                const StatusIcon = meta.icon;
                const categoryLabel = CATEGORIES.find((cat) => cat.value === c.category)?.label || c.category;
                return (
                  <div
                    key={c._id}
                    className="p-5 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-200/80 shadow-xs transition-all cursor-pointer"
                    onClick={() => openDetail(c)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">
                            {c.referenceId}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-xl border ${meta.bg}`}>
                            <StatusIcon className="w-3 h-3" />
                            {meta.label}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg capitalize ${priorityMeta[c.priority]}`}>
                            {c.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm truncate">{c.title}</h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap">
                          <span>{categoryLabel}</span>
                          <span>·</span>
                          <span>{new Date(c.createdAt).toLocaleDateString("en-GB")}</span>
                          {c.messages.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-teal-600">
                                <MessageSquare className="w-3 h-3" />
                                {c.messages.length} message{c.messages.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-teal-600 font-semibold flex items-center gap-1 self-start sm:self-center flex-shrink-0">
                        View Details
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
