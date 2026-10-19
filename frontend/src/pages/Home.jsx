import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Search,
  Calendar,
  ShieldCheck,
  Clock,
  HeartPulse,
  UserCheck,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
} from "lucide-react";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate("/doctors");
    }
  };

  const specialties = [
    "Cardiologist",
    "General Physician",
    "Neurologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic",
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 medical-bg-mesh relative overflow-hidden">
      {/* Ambient glowing background orbs for calm medical vibe */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none animate-float-reverse" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center max-w-3xl mx-auto space-y-6"
          >
            {/* Top pill */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-semibold tracking-wide uppercase shadow-xs animate-heartbeat-glow"
            >
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              <span>Verified Medical Healthcare Network</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]"
            >
              Calm, Reliable Healthcare,{" "}
              <span className="bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-600 bg-clip-text text-transparent">
                Simplified.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal"
            >
              Book consultations with BMDC-verified doctors in minutes. Zero waiting room stress, atomic conflict-free slot scheduling, and direct patient management.
            </motion.p>

            {/* Interactive Search Box */}
            <motion.form
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              onSubmit={handleSearch}
              className="mt-8 max-w-2xl mx-auto bg-white/90 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl shadow-xl shadow-teal-900/5 border border-slate-200/80 flex flex-col sm:flex-row gap-2 transition-all hover:border-teal-300"
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search doctor or specialty (e.g. Cardiologist)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none text-sm font-medium bg-transparent"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                Find Doctors
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.form>

            {/* Specialty Quick Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="pt-2 flex flex-wrap items-center justify-center gap-2"
            >
              <span className="text-xs text-slate-500 font-medium">Popular:</span>
              {specialties.map((spec) => (
                <motion.button
                  key={spec}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/doctors?search=${encodeURIComponent(spec)}`)}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-white text-slate-600 border border-slate-200/80 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-2xs"
                >
                  {spec}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Key Feature Pillars */}
      <section className="py-16 bg-white/70 backdrop-blur-xs border-y border-slate-200/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-slate-50/80 rounded-3xl p-7 border border-slate-100 hover:border-teal-200/80 transition-all hover:shadow-xl hover:shadow-teal-900/5 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                100% BMDC Verified
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every doctor undergoes administrative credential validation before consulting patients on the platform.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-slate-50/80 rounded-3xl p-7 border border-slate-100 hover:border-teal-200/80 transition-all hover:shadow-xl hover:shadow-teal-900/5 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xs">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Atomic Slot Reservation
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Real-time booking with atomic database locking guarantees zero conflicting schedules or double-booked slots.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-slate-50/80 rounded-3xl p-7 border border-slate-100 hover:border-teal-200/80 transition-all hover:shadow-xl hover:shadow-teal-900/5 group cursor-default"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xs">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Calm Patient Portal
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track status changes, manage consultation history, and receive medical updates from an intuitive interface.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-teal-700 tracking-wider uppercase bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Effortless Flow
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3">
            How It Works for Patients
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Get an appointment scheduled with your preferred doctor in 3 easy steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "1",
              title: "Select Your Specialist",
              desc: "Filter by specialty, consultation fee, and doctor profile to find the ideal match for your health needs.",
            },
            {
              step: "2",
              title: "Choose an Available Slot",
              desc: "Pick an open date and time slot created by the doctor. Provide a brief reason for visit and confirm.",
            },
            {
              step: "3",
              title: "Consultation & Care",
              desc: "Admin confirms the slot, the doctor receives your details, and completes your consultation smoothly.",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs relative"
            >
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-bold text-sm flex items-center justify-center mb-5 shadow-xs shadow-teal-600/30">
                {item.step}
              </span>
              <h4 className="font-bold text-slate-800 text-base mb-2">
                {item.title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Doctor Call-To-Action Banner */}
      <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-teal-900/10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
        >
          {/* subtle decoration orb */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-semibold backdrop-blur-xs">
              <Stethoscope className="w-3.5 h-3.5" />
              For Healthcare Professionals
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Are you a certified doctor?
            </h3>
            <p className="text-teal-100/90 text-sm sm:text-base leading-relaxed">
              Expand your clinical practice. Create flexible availability slots, manage appointments, and deliver modern patient consultations with DocSheba.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/apply-doctor"
                className="block px-6 py-3.5 rounded-xl bg-white text-teal-800 hover:bg-teal-50 font-bold text-sm text-center transition-all shadow-md"
              >
                Apply as Doctor
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/doctors"
                className="block px-6 py-3.5 rounded-xl bg-teal-600/50 hover:bg-teal-600 text-white font-medium text-sm text-center border border-white/20 transition-all"
              >
                Browse Network
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
