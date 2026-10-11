import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";
import { Link } from "react-router";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    fetchAppointments();
  }, []);

  const statusColor = {
    pending: "badge-warning",
    approved: "badge-info",
    completed: "badge-success",
    cancelled: "badge-error",
  };

  const counts = {
    upcoming: appointments.filter((a) => a.status === "pending" || a.status === "approved").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-1">
        Welcome back, {user?.name}
      </h2>
      <p className="text-gray-500 mb-6">Here's what's happening with your appointments</p>

      <div className="stats shadow w-full mb-8">
        <div className="stat">
          <div className="stat-title">Upcoming</div>
          <div className="stat-value text-primary">{counts.upcoming}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Completed</div>
          <div className="stat-value">{counts.completed}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Cancelled</div>
          <div className="stat-value">{counts.cancelled}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">My Appointments</h3>
        <Link to="/doctors" className="btn btn-primary btn-sm">
          + Book New Appointment
        </Link>
        <Link to="/apply-doctor" className="btn btn-outline btn-sm">
          Apply as Doctor
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && appointments.length === 0 && (
        <p className="text-gray-500">No appointments yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {appointments.map((appt) => (
          <div key={appt._id} className="card bg-base-200 shadow-sm">
            <div className="card-body flex-row items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-10">
                    <span>{appt.doctor?.name?.[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{appt.doctor?.name}</p>
                  <p className="text-sm text-gray-500">
                    {appt.slot?.date?.slice(0, 10)} · {appt.slot?.startTime}
                  </p>
                </div>
              </div>
              <span className={`badge ${statusColor[appt.status]}`}>
                {appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}