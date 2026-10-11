import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function DoctorList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [reason, setReason] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get("/doctors", {
        params: specialization ? { specialization } : {},
      });
      setDoctors(res.data.payload.doctors);
    } catch (err) {
      setError(err.response?.data?.message || "failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const openBooking = async (doctor) => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSelectedDoctor(doctor);
    setSelectedSlotId(null);
    setReason("");
    setBookingError("");
    setBookingSuccess(false);
    setSlotsLoading(true);

    try {
      const res = await axiosInstance.get(`/slots/doctor/${doctor.user._id}`);
      setSlots(res.data.payload.slots);
    } catch (err) {
      setBookingError(err.response?.data?.message || "failed to load slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  const closeBooking = () => {
    setSelectedDoctor(null);
  };

  const handleBook = async () => {
    if (!selectedSlotId) {
      setBookingError("please select a slot");
      return;
    }
    setBooking(true);
    setBookingError("");
    try {
      await axiosInstance.post("/appointments", {
        slotId: selectedSlotId,
        reason,
      });
      setBookingSuccess(true);
    } catch (err) {
      setBookingError(err.response?.data?.message || "booking failed");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-1">Find a Doctor</h2>
      <p className="text-gray-500 mb-6">Browse our verified doctors</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search by specialization (e.g. Cardiologist)"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && doctors.length === 0 && (
        <p className="text-gray-500">No doctors found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {doctors.map((doc) => (
          <div key={doc._id} className="card bg-base-200 shadow-sm">
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-12">
                    <span>{doc.user?.name?.[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold">{doc.user?.name}</p>
                  <p className="text-sm text-gray-500">{doc.specialization}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">{doc.qualification}</p>
              <p className="text-sm text-gray-500">
                {doc.experienceYears} years experience
              </p>
              <p className="text-sm font-medium">Fee: ৳{doc.fee}</p>
              <button
                onClick={() => openBooking(doc)}
                className="btn btn-primary btn-sm mt-2"
              >
                Book Appointment
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div className="modal modal-open">
          <div className="modal-box">
            {bookingSuccess ? (
              <>
                <h3 className="font-bold text-lg mb-2">Booking requested!</h3>
                <p className="text-gray-500 mb-4">
                  Your appointment with {selectedDoctor.user?.name} is now
                  pending admin approval.
                </p>
                <button onClick={closeBooking} className="btn btn-primary w-full">
                  Close
                </button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-lg mb-4">
                  Book with {selectedDoctor.user?.name}
                </h3>

                {slotsLoading && <p className="text-gray-500">Loading slots...</p>}

                {!slotsLoading && slots.length === 0 && !bookingError && (
                  <p className="text-gray-500 mb-4">
                    No available slots right now.
                  </p>
                )}

                {!slotsLoading && slots.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {slots.map((slot) => (
                      <label
                        key={slot._id}
                        className={`flex items-center gap-3 p-3 rounded border cursor-pointer ${
                          selectedSlotId === slot._id
                            ? "border-primary bg-primary/10"
                            : "border-base-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="slot"
                          checked={selectedSlotId === slot._id}
                          onChange={() => setSelectedSlotId(slot._id)}
                          className="radio radio-primary radio-sm"
                        />
                        <span>
                          {slot.date?.slice(0, 10)} · {slot.startTime} -{" "}
                          {slot.endTime}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {slots.length > 0 && (
                  <textarea
                    placeholder="Reason for visit (optional)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="textarea textarea-bordered w-full mb-4"
                  />
                )}

                {bookingError && (
                  <p className="text-red-500 mb-4">{bookingError}</p>
                )}

                <div className="modal-action">
                  <button onClick={closeBooking} className="btn btn-ghost">
                    Cancel
                  </button>
                  {slots.length > 0 && (
                    <button
                      onClick={handleBook}
                      disabled={booking || !selectedSlotId}
                      className="btn btn-primary"
                    >
                      {booking ? "Booking..." : "Confirm Booking"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}