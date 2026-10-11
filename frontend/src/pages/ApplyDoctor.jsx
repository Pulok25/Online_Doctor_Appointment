import { useState } from "react";
import { useNavigate } from "react-router";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function ApplyDoctor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    specialization: "",
    qualification: "",
    experienceYears: "",
    fee: "",
    bmdcNumber: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await axiosInstance.post("/doctors/apply", {
        ...form,
        experienceYears: Number(form.experienceYears),
        fee: Number(form.fee),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "application failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-2">Application Submitted</h2>
        <p className="text-gray-500 mb-4">
          Your application is pending admin review. You'll be upgraded to a
          doctor account once approved.
        </p>
        <button
          onClick={() => navigate("/patient/dashboard")}
          className="btn btn-primary"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-1">Apply as Doctor</h2>
      <p className="text-gray-500 mb-4">
        Fill in your professional details for admin review
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="specialization"
          placeholder="Specialization (e.g. Cardiologist)"
          value={form.specialization}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="qualification"
          placeholder="Qualification (e.g. MBBS, FCPS)"
          value={form.qualification}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="experienceYears"
          type="number"
          placeholder="Years of experience"
          value={form.experienceYears}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="fee"
          type="number"
          placeholder="Consultation fee (৳)"
          value={form.fee}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="bmdcNumber"
          placeholder="BMDC Registration Number"
          value={form.bmdcNumber}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <textarea
          name="bio"
          placeholder="Short bio (optional)"
          value={form.bio}
          onChange={handleChange}
          className="textarea textarea-bordered w-full"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}