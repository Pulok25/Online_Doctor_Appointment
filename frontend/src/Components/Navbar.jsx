import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-200 px-6">
      <div className="flex-1">
        <Link to="/" className="text-lg font-semibold">
          MediCare
        </Link>
      </div>
      <div className="flex gap-3 items-center">
        {!user && (
          <>
            <Link to="/login" className="btn btn-sm btn-ghost">
              Login
            </Link>
            <Link to="/register" className="btn btn-sm btn-primary">
              Register
            </Link>
          </>
        )}
        {user && (
          <>
            <span className="text-sm text-gray-500">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout} className="btn btn-sm btn-outline">
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}