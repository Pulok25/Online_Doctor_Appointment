import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  HeartPulse,
  Search,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  Calendar,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin/applications";
    if (user.role === "doctor") return "/doctor/dashboard";
    return "/patient/dashboard";
  };

  const roleBadgeColor = {
    admin: "bg-purple-50 text-purple-700 border-purple-200",
    doctor: "bg-teal-50 text-teal-700 border-teal-200",
    patient: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-teal-500/20 group-hover:shadow-md group-hover:shadow-teal-500/30 transition-all">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-800 tracking-tight">
                  DocSheba
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-100">
                  Care
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none hidden sm:block">
                Online Clinic & Patient Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>

            <Link
              to="/doctors"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/doctors")
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Search className="w-4 h-4 text-teal-600" />
              Find Doctors
            </Link>

            {user && (
              <Link
                to={getDashboardLink()}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(getDashboardLink())
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-teal-600" />
                Dashboard
              </Link>
            )}

            {user?.role === "patient" && (
              <Link
                to="/apply-doctor"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/apply-doctor")
                    ? "bg-teal-50 text-teal-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Join as Doctor
              </Link>
            )}
          </nav>

          {/* Desktop Auth / User Info */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50/50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-600/20 transition-all active:scale-98"
                >
                  Create Account
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-semibold flex items-center justify-center text-sm ring-2 ring-white shadow-xs">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </p>
                    <span
                      className={`inline-block text-[11px] font-medium px-2 py-0.2 rounded-full border capitalize ${
                        roleBadgeColor[user.role] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-5 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
          >
            Home
          </Link>
          <Link
            to="/doctors"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
          >
            <Search className="w-4 h-4 text-teal-600" />
            Find Doctors
          </Link>

          {user && (
            <Link
              to={getDashboardLink()}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600" />
              Dashboard ({user.role})
            </Link>
          )}

          {user?.role === "patient" && (
            <Link
              to="/apply-doctor"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Apply as Doctor
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100">
            {!user ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-medium text-white bg-teal-600 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}