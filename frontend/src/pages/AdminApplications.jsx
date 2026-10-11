import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(
        `/doctors/applications?status=${status}`
      );
      setApplications(res.data.payload.applications);
    } catch (err) {
      setError(err.response?.data?.message || "failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const handleAction = async (id, action) => {
    setActingId(id);
    setError("");
    try {
      await axiosInstance.patch(`/doctors/${id}/${action}`);
      await fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || "action failed");
    } finally {
      setActingId(null);
    }
  };

  const tabs = ["pending", "approved", "rejected"];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-1">Doctor Applications</h2>
      <p className="text-gray-500 mb-6">Review and manage doctor applications</p>

      <div className="tabs tabs-boxed w-fit mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`tab ${status === tab ? "tab-active" : ""}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && applications.length === 0 && (
        <p className="text-gray-500">No {status} applications.</p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((app) => (
          <div key={app._id} className="card bg-base-200 shadow-sm">
            <div className="card-body py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {app.user?.name} — {app.user?.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {app.specialization} · {app.qualification} ·{" "}
                    {app.experienceYears} yrs
                  </p>
                  <p className="text-sm text-gray-400">
                    BMDC: {app.bmdcNumber} · Fee: ৳{app.fee}
                  </p>
                </div>
                {status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(app._id, "approve")}
                      disabled={actingId === app._id}
                      className="btn btn-sm btn-success"
                    >
                      {actingId === app._id ? "..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(app._id, "reject")}
                      disabled={actingId === app._id}
                      className="btn btn-sm btn-error"
                    >
                      {actingId === app._id ? "..." : "Reject"}
                    </button>
                  </div>
                )}
                {status !== "pending" && (
                  <span
                    className={`badge ${
                      status === "approved" ? "badge-success" : "badge-error"
                    }`}
                  >
                    {status}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}