import { useState } from "react";
import { useNavigate } from "react-router";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import {
  Stethoscope,
  Award,
  Clock,
  DollarSign,
  ShieldCheck,
  FileText,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Profile image must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
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
      const formData = new FormData();
      formData.append("specialization", form.specialization);
      formData.append("qualification", form.qualification);
      formData.append("experienceYears", Number(form.experienceYears));
      formData.append("fee", Number(form.fee));
      formData.append("bmdcNumber", form.bmdcNumber);
      formData.append("bio", form.bio || "");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await axiosInstance.post("/doctors/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit doctor application");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 medical-bg-mesh">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-cyan-500" />
          
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Application Received!
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Your BMDC details and photo have been forwarded to the medical administration team. Upon approval, your account role will be automatically upgraded to <strong>Doctor</strong>.
          </p>

          <button
            onClick={() => navigate("/patient/dashboard")}
            className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all active:scale-98"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 medical-bg-mesh pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 overflow-hidden">
          {/* Top Banner */}
          <div className="p-8 sm:p-10 bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-800 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-100 text-xs font-semibold backdrop-blur-xs mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Physician Accreditation Program
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Join Our Verified Medical Network
            </h1>
            <p className="text-teal-100/90 text-sm mt-1 max-w-xl leading-relaxed">
              Upload your professional photo, publish consultation slots, and practice on a conflict-free appointment system.
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Doctor Profile Photo <span className="text-slate-400 font-normal">(Optional, max 2MB)</span>
                </label>

                {imagePreview ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover ring-2 ring-teal-500 shadow-xs"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800">
                        {imageFile?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {(imageFile?.size / 1024).toFixed(1)} KB
                      </p>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl bg-slate-50/60 hover:bg-teal-50/20 cursor-pointer transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-teal-100/70 text-teal-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-teal-700">
                      Click to upload professional photo
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      JPEG, PNG, or WebP up to 2MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Medical Specialization
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <input
                      name="specialization"
                      type="text"
                      required
                      placeholder="e.g. Cardiologist, Neurologist"
                      value={form.specialization}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    BMDC Registration Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <input
                      name="bmdcNumber"
                      type="text"
                      required
                      placeholder="e.g. A-12345"
                      value={form.bmdcNumber}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Qualifications & Degrees
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <input
                    name="qualification"
                    type="text"
                    required
                    placeholder="e.g. MBBS, FCPS (Medicine), MD (Cardiology)"
                    value={form.qualification}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Years of Experience
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      name="experienceYears"
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 8"
                      value={form.experienceYears}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Consultation Fee (৳ BDT)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                      ৳
                    </div>
                    <input
                      name="fee"
                      type="number"
                      required
                      min="0"
                      placeholder="e.g. 1000"
                      value={form.fee}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Professional Biography / Practice Overview
                </label>
                <div className="relative">
                  <textarea
                    name="bio"
                    rows={3}
                    placeholder="Brief overview of clinical interests, current hospital affiliation, or patient care philosophy..."
                    value={form.bio}
                    onChange={handleChange}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-3 text-xs text-teal-800">
                <ShieldCheck className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  By submitting this application, you certify that the provided BMDC number and medical credentials are valid. You will be notified once our admin verification is completed.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Doctor Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}