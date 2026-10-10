import { useState } from "react";
import { useNavigate } from "react-router";
import axiosInstance from "../api/axiosInstance";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activationToken, setActivationToken] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/users/register", form);
      setActivationToken(res.data.payload.token);
    } catch (err) {
      setError(err.response?.data?.message || "something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setError("");
    setLoading(true);
    try {
      await axiosInstance.post("/users/activate", { token: activationToken });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "activation failed");
    } finally {
      setLoading(false);
    }
  };

  if (activationToken) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Verify your account</h2>
        <p className="mb-4 text-sm text-gray-500">
          In a real app this would be emailed to you. Click below to activate.
        </p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleActivate}
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? "Activating..." : "Activate Account"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="phone"
          placeholder="Phone"
          value={form.phone}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        <input
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleChange}
          className="input input-bordered w-full"
        />
        {error && <p className="text-red-500">{error}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}