import { Routes, Route, Navigate } from "react-router";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import PatientDashboard from "../pages/PatientDashboard";
import DoctorDashboard from "../pages/DoctorDashboard";
import AdminApplications from "../pages/AdminApplications";
import DoctorList from "../pages/DoctorList";
import ApplyDoctor from "../pages/ApplyDoctor";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/patient/dashboard" element={<PatientDashboard />} />
      <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
      <Route path="/admin/applications" element={<AdminApplications />} />
      <Route path="/doctors" element={<DoctorList />} />
      <Route path="/apply-doctor" element={<ApplyDoctor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}