import { useAuth } from "../context/AuthContext";

export default function PatientDashboard() {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Welcome, {user?.name}</h2>
      <p className="text-gray-500">Patient dashboard — coming soon</p>
    </div>
  );
}