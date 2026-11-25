import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
  Send,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  User,
  Filter,
} from "lucide-react";

const CATEGORIES = {
  billing: "Billing & Payment",
  doctor_behavior: "Doctor Behavior",
  appointment: "Appointment Issue",
  service_quality: "Service Quality",
  prescription: "Prescription",
  technical: "Technical Problem",
  other: "Other",
};

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

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actingId, setActingId] = useState(null);

  // Expanded detail card
  const [expandedId, setExpandedId] = useState(null);
  const [detailMap, setDetailMap] = useState({}); // id -> full complaint
  const [detailLoading, setDetailLoading] = useState(null);

  // Response form state per complaint
  const [responseForm, setResponseForm] = useState({ status: "", text: "" });
  const [expandedMessages, setExpandedMessages] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterPriority !== "all") params.set("priority", filterPriority);
      const res = await axiosInstance.get(`/complaints/?${params.toString()}`);
      setComplaints(res.data.payload.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus, filterPriority]);

  const toggleExpand = async (complaint) => {
    if (expandedId === complaint._id) {
      setExpandedId(null);
      setExpandedMessages(false);
      return;
    }
    setExpandedId(complaint._id);
    setExpandedMessages(false);
    setResponseForm({ status: complaint.status, text: "" });

    if (!detailMap[complaint._id]) {
      setDetailLoading(complaint._id);
      try {
        const res = await axiosInstance.get(`/complaints/${complaint._id}`);
        setDetailMap((prev) => ({ ...prev, [complaint._id]: res.data.payload.complaint }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load complaint details");
      } finally {
        setDetailLoading(null);
      }
    }
  };

  const handleUpdate = async (complaintId) => {
    if (!responseForm.status && !responseForm.text.trim()) {
      setError("Please select a status or enter a reply message");
      return;
    }
    setActingId(complaintId);
    setError("");
    try {
      const payload = {};
      if (responseForm.status) payload.status = responseForm.status;
      if (responseForm.text.trim()) payload.text = responseForm.text.trim();

      const res = await axiosInstance.patch(`/complaints/${complaintId}`, payload);
      const updated = res.data.payload.complaint;

      // Update local state
      setComplaints((prev) =>
        prev.map((c) => (c._id === complaintId ? { ...c, status: updated.status, messages: updated.messages } : c))
      );
      setDetailMap((prev) => ({ ...prev, [complaintId]: updated }));
      setResponseForm((prev) => ({ ...prev, text: "" }));
      setSuccessMsg("Complaint updated successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update complaint");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Admin — Complaint Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Complaints
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review, respond to, and resolve patient complaints
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
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

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
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
            {/* Priority filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {["all", "low", "medium", "high", "urgent"].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                    filterPriority === p
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Complaint Count */}
        {!loading && (
          <p className="text-xs text-slate-500 font-medium">
            {complaints.length} complaint{complaints.length !== 1 ? "s" : ""} found
          </p>
        )}

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
            <h3 className="font-bold text-slate-800 text-base">No complaints</h3>
            <p className="text-xs text-slate-500 mt-1">No complaints match the current filters.</p>
          </div>
        )}

        {/* Complaint Cards */}
        <div className="space-y-3.5">
          {complaints.map((c) => {
            const meta = statusMeta[c.status] || statusMeta.pending;
            const StatusIcon = meta.icon;
            const isExpanded = expandedId === c._id;
            const detail = detailMap[c._id];

            return (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-slate-200/80 hover:border-rose-200/60 shadow-xs transition-all overflow-hidden"
              >
                {/* Summary Row */}
                <div
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => toggleExpand(c)}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-100 to-orange-100 text-rose-800 font-bold text-sm flex items-center justify-center flex-shrink-0 border border-rose-200/60">
                      {c.patient?.name?.[0]?.toUpperCase() || "P"}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
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
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {c.patient?.name}
                        </span>
                        <span>{CATEGORIES[c.category] || c.category}</span>
                        <span>·</span>
                        <span>{new Date(c.createdAt).toLocaleDateString("en-GB")}</span>
                        {c.messages?.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1 text-teal-600">
                              <MessageSquare className="w-3 h-3" />
                              {c.messages.length} msg
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 self-start sm:self-center flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                    {detailLoading === c._id && (
                      <div className="flex justify-center py-6">
                        <div className="w-6 h-6 border-2 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {detail && (
                      <>
                        {/* Patient Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Patient</p>
                            <p className="text-slate-800 font-semibold">{detail.patient?.name}</p>
                          </div>
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Email</p>
                            <p className="text-slate-800 font-semibold">{detail.patient?.email}</p>
                          </div>
                          <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <p className="text-slate-400 font-semibold uppercase tracking-wide mb-0.5">Phone</p>
                            <p className="text-slate-800 font-semibold">{detail.patient?.phone || "N/A"}</p>
                          </div>
                        </div>

                        {/* Original Description */}
                        <div>
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
                          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {detail.description}
                          </p>
                        </div>

                        {/* Linked Appointment */}
                        {detail.appointment && (
                          <div className="text-xs bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <p className="font-semibold text-blue-700 mb-0.5">Linked Appointment</p>
                            <p className="text-blue-600">
                              {detail.appointment.slot?.date?.slice(0, 10) || "N/A"} · Status: {detail.appointment.status}
                            </p>
                          </div>
                        )}

                        {/* Conversation Thread */}
                        {detail.messages.length > 0 && (
                          <div>
                            <button
                              onClick={() => setExpandedMessages((v) => !v)}
                              className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 hover:text-slate-900 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                              Conversation ({detail.messages.length})
                              {expandedMessages ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            {expandedMessages && (
                              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                                {detail.messages.map((msg, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                        msg.sender === "admin"
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
                          </div>
                        )}

                        {/* Admin Response & Status Update Form */}
                        <div className="border-t border-slate-100 pt-4 space-y-4">
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Response</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Update Status</label>
                              <select
                                value={responseForm.status}
                                onChange={(e) => setResponseForm((prev) => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                              >
                                <option value="">— Keep current status —</option>
                                <option value="pending">Pending</option>
                                <option value="in_review">In Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="dismissed">Dismissed</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reply / Note</label>
                            <textarea
                              rows={3}
                              value={responseForm.text}
                              onChange={(e) => setResponseForm((prev) => ({ ...prev, text: e.target.value }))}
                              placeholder="Enter your official response to the patient…"
                              maxLength={2000}
                              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none"
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleUpdate(c._id)}
                              disabled={actingId === c._id}
                              className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {actingId === c._id ? "Updating…" : "Submit Response"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
