import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/appointments/myappointment");
      setAppointments(res.data.payload.appointments);
    } catch (err) {
      setError(err.response?.data?.message || "failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleComplete = async (id) => {
    setUpdatingId(id);
    setError("");
    try {
      await axiosInstance.patch(`/appointments/${id}/status`, {
        status: "completed",
      });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || "failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const statusColor = {
    pending: "badge-warning",
    approved: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
  };

  const counts = {
    pending: appointments.filter((a) => a.status === "pending").length,
    approved: appointments.filter((a) => a.status === "approved").length,
    completed: appointments.filter((a) => a.status === "completed").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-1">
        Welcome, Dr. {user?.name}
      </h2>
      <p className="text-gray-500 mb-6">Manage your patient appointments</p>

      <div className="stats shadow w-full mb-8">
        <div className="stat">
          <div className="stat-title">Pending</div>
          <div className="stat-value text-warning">{counts.pending}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Approved</div>
          <div className="stat-value text-info">{counts.approved}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Completed</div>
          <div className="stat-value text-success">{counts.completed}</div>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4">My Appointments</h3>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p className="text-gray-500">No appointments yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {appointments.map((appt) => (
          <div key={appt._id} className="card bg-base-200 shadow-sm">
            <div className="card-body py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="avatar placeholder">
                    <div className="bg-neutral text-neutral-content rounded-full w-10">
                      <span>{appt.patient?.name?.[0]}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium">{appt.patient?.name}</p>
                    <p className="text-sm text-gray-500">
                      {appt.patient?.phone} · {appt.slot?.date?.slice(0, 10)} ·{" "}
                      {appt.slot?.startTime}
                    </p>
                    {appt.reason && (
                      <p className="text-sm text-gray-400">
                        Reason: {appt.reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusColor[appt.status]}`}>
                    {appt.status}
                  </span>
                  {appt.status === "approved" && (
                    <button
                      onClick={() => handleComplete(appt._id)}
                      disabled={updatingId === appt._id}
                      className="btn btn-sm btn-success"
                    >
                      {updatingId === appt._id ? "..." : "Mark Completed"}
                    </button>
                  )}
                  {appt.status === "pending" && (
                    <span className="text-xs text-gray-400">
                      Waiting for admin approval
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}