import { useAuth } from "../context/AuthContext";

export default function DoctorDashboard() {
  const { user } = useAuth();
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold">Welcome, Dr. {user?.name}</h2>
      <p className="text-gray-500">Doctor dashboard — coming soon</p>
    </div>
  );
}