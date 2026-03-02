import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import BookingPolicy from "../shared/BookingPolicy";
import ServiceCard from "../shared/ServiceCard";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { bookingsAPI, businessAPI } from "../../utils/api";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDurationToDays(duration: string): number {
  if (!duration) return 0;
  const match = duration.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'day': case 'days': return value;
    case 'week': case 'weeks': return value * 7;
    case 'month': case 'months': return value * 30;
    default: return 0;
  }
}

const SERVICE_TYPE_CONFIG: Record<string, { icon: string; label: string; calendarLabel: string }> = {
  appointment: { icon: '📅', label: 'Appointment', calendarLabel: 'Select your appointment date' },
  preparation: { icon: '🎂', label: 'Preparation / Order', calendarLabel: 'Select your pickup / delivery date' },
  occupancy: { icon: '🏗️', label: 'Occupancy / Rental', calendarLabel: 'Select your start date' }
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [takenTimeSlots, setTakenTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [bookingPolicy, setBookingPolicy] = useState({ title: "Booking Policy", description: "", policyList: [] as string[] });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [minAdvanceDays, setMinAdvanceDays] = useState(0);
  const [blockedByOccupancy, setBlockedByOccupancy] = useState(false);

  const [formData, setFormData] = useState({ fullName: "", emailAddress: "", mobileNumber: "", address: "", message: "" });
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);

  const selectedService = location.state?.selectedService;
  const serviceType: string = selectedService?.serviceType || 'appointment';
  const typeConfig = SERVICE_TYPE_CONFIG[serviceType] || SERVICE_TYPE_CONFIG.appointment;
  const durationDays = parseDurationToDays(selectedService?.duration || '');

  // Only occupancy gets an end date span — preparation is single date only
  const occupancyEndDate = serviceType === 'occupancy' && selectedDate && durationDays > 0
    ? addDaysToDate(selectedDate, durationDays - 1)
    : null;

  useEffect(() => { loadBusinessData(); }, []);

  // Auto-select first available date for preparation and occupancy after business data loads
  useEffect(() => {
    if (!businessData || serviceType === 'appointment') return;
    const firstAvailable = findFirstAvailableDate();
    if (firstAvailable) {
      setSelectedDate(firstAvailable);
    }
  }, [businessData, minAdvanceDays]);

  useEffect(() => {
    if (selectedDate && businessData && selectedService) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getBySlug(businessSlug || '');
      const business = response.data.business;
      setBusinessData(business);
      setBookingPolicy({
        title: business.bookingPolicyTitle || "Booking Policy",
        description: business.bookingPolicyDescription || "",
        policyList: business.bookingPolicyList || []
      });
    } catch (err) {
      setError('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  // Find the first selectable date starting from today (up to 60 days ahead)
  const findFirstAvailableDate = (): Date | null => {
    if (!businessData) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const minDate = addDaysToDate(today, minAdvanceDays);

    for (let i = 0; i <= 60; i++) {
      const candidate = addDaysToDate(minDate, i);
      const dayOfWeek = candidate.toLocaleDateString('en-US', { weekday: 'long' });
      const daySchedule = businessData?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
      if (daySchedule?.enabled) {
        // Make sure calendar month is showing the right month
        setCurrentMonth(new Date(candidate.getFullYear(), candidate.getMonth(), 1));
        return candidate;
      }
    }
    return null;
  };

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedService || !businessSlug) return;
    try {
      setLoadingSlots(true);
      const response = await bookingsAPI.getAvailableSlots(
        businessSlug,
        formatDateYMD(date),
        { serviceId: selectedService.id }
      );
      setAvailableTimeSlots(response.data.availableSlots || []);
      setTakenTimeSlots(response.data.takenSlots || []);
      setMinAdvanceDays(response.data.minAdvanceDays || 0);
      setBlockedByOccupancy(response.data.blockedByOccupancy || false);
      setSelectedTime(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch available times');
      setAvailableTimeSlots([]);
      setTakenTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateSelectable = (day: number | null): boolean => {
    if (!day || !businessData) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    const minDate = addDaysToDate(today, minAdvanceDays);
    if (date < minDate) return false;
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = businessData?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
    return daySchedule?.enabled || false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!selectedDate) { setError("Please select a date"); return; }
    if (serviceType === 'appointment' && !selectedTime) {
      setError("Please select a time slot"); return;
    }
    if (!formData.fullName || !formData.emailAddress || !formData.mobileNumber) {
      setError("Please fill in all required fields"); return;
    }
    if (!agreeToPolicy) { setError("Please agree to the booking policy"); return; }

    try {
      setSubmitting(true);
      const selectedSlot = availableTimeSlots.find(slot => slot.display === selectedTime);
      const bookingTime = selectedSlot?.time || availableTimeSlots[0]?.time || '09:00';

      const bookingData = {
        businessSlug,
        serviceId: selectedService.id,
        clientName: formData.fullName,
        clientEmail: formData.emailAddress,
        clientPhone: formData.mobileNumber,
        clientAddress: formData.address,
        bookingDate: formatDateYMD(selectedDate),
        bookingTime,
        notes: formData.message,
      };

      const response = await bookingsAPI.create(bookingData);
      localStorage.setItem(`booking_${businessSlug}_email`, formData.emailAddress);
      window.dispatchEvent(new Event('clientEmailUpdated'));

      navigate(`/${businessSlug}/confirmation`, {
        state: {
          selectedService,
          booking: response.data.booking,
          bookingDetails: {
            date: selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: selectedTime,
            endDate: occupancyEndDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            ...formData
          },
          hasChatHistory: response.data.hasChatHistory,
          chatMessageCount: response.data.chatMessageCount,
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking');
      setSubmitting(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  if (!selectedService) return <Navigate to={`/${businessSlug}/services`} replace />;

  if (submitting) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating your booking...</h3>
          <p className="text-sm text-gray-500">Please wait while we confirm your appointment</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            {error}
            <button onClick={() => setError('')} className="ml-2 underline hover:no-underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="mb-6 border-b border-gray-100 w-full pb-4">
        <button onClick={() => navigate(`/${businessSlug}/services`)} className="flex items-center gap-2 hover:opacity-70 transition">
          {FaChevronLeft({ size: 16 })}
          <span className="text-sm lg:text-base font-semibold">Booking details</span>
        </button>
      </div>

      <BookingPolicy title={bookingPolicy.title} description={bookingPolicy.description} policyList={bookingPolicy.policyList} />

      <ServiceCard
        id={selectedService.id}
        title={selectedService.title}
        duration={selectedService.duration}
        price={selectedService.price}
        description={selectedService.description}
        image={selectedService.image}
        serviceType={selectedService.serviceType}
        showArrow={false}
      />

      {/* ── Date & Time Selector ── */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2 lg:text-base text-sm">{typeConfig.calendarLabel}</h2>

        {/* Context banners */}
        {serviceType === 'preparation' && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              🎂 <strong>Preparation service:</strong> This service takes <strong>{selectedService.duration}</strong> to prepare.
              Select the date you want to <strong>receive or pick up</strong> your order.
            </p>
          </div>
        )}

        {serviceType === 'occupancy' && (
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-800">
              🏗️ <strong>Occupancy / Rental:</strong> Select a <strong>start date</strong>.
              This service spans <strong>{selectedService.duration}</strong>.
              {selectedDate && occupancyEndDate && (
                <span> Your booking will run from{' '}
                  <strong>{selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</strong> to{' '}
                  <strong>{occupancyEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Always lg:grid-cols-2 — both columns always mounted, no layout shift */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Calendar ── */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">

            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
                  if (serviceType === 'appointment') {
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {FaChevronLeft({ className: "w-4 h-4 text-gray-600" })}
              </button>
              <h3 className="text-sm font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => {
                  setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
                  if (serviceType === 'appointment') {
                    setSelectedDate(null);
                    setSelectedTime(null);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {FaChevronRight({ className: "w-4 h-4 text-gray-600" })}
              </button>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelectable = isDateSelectable(day);

                // Only occupancy gets span highlight — preparation is single date
                const isInSpan = serviceType === 'occupancy'
                  && selectedDate && occupancyEndDate
                  && date > selectedDate && date <= occupancyEndDate;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      if (!isSelectable) return;
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    disabled={!isSelectable}
                    title={!isSelectable ? 'Not available' : undefined}
                    className={`
                      aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition-all duration-150
                      ${isSelected
                        ? 'bg-primaryGreen text-white shadow-sm scale-105'
                        : isInSpan
                        ? 'bg-green-100 text-green-800'
                        : isToday && isSelectable
                        ? 'border-2 border-primaryGreen text-primaryGreen hover:bg-green-50'
                        : isSelectable
                        ? 'hover:bg-gray-100 text-gray-700 cursor-pointer'
                        : 'text-gray-200 cursor-not-allowed'}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs text-gray-400 text-center">🕐 {businessData?.timezone || 'UTC'}</p>

              {minAdvanceDays > 0 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 text-center font-medium">
                    ⓘ Requires {minAdvanceDays} {minAdvanceDays === 1 ? 'day' : 'days'} advance notice
                  </p>
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-primaryGreen"></div>
                  <span className="text-xs text-gray-400">Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded border border-gray-200"></div>
                  <span className="text-xs text-gray-400">Unavailable</span>
                </div>
              </div>

              {/* Occupancy span summary */}
              {serviceType === 'occupancy' && selectedDate && occupancyEndDate && (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800 text-center font-medium">
                    📅 {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {occupancyEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}

              {/* Preparation selected date summary */}
              {serviceType === 'preparation' && selectedDate && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800 text-center font-medium">
                    🎂 Pickup/delivery: {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Slots panel — always mounted, content switches based on state ── */}
          <div className="flex flex-col justify-start">
            {!selectedDate ? (
              <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 min-h-48">
                <p className="text-sm text-gray-400">Select a date to see availability</p>
              </div>
            ) : loadingSlots ? (
              <div className="flex items-center justify-center min-h-48">
                <div className="w-8 h-8 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : blockedByOccupancy ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                <p className="text-sm font-semibold text-red-800">📵 Date fully booked</p>
                <p className="text-xs text-red-600 mt-1">This date is blocked by an existing occupancy booking. Please select a different date.</p>
              </div>
            ) : serviceType === 'preparation' ? (
              availableTimeSlots.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Select pickup / delivery time:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                    {availableTimeSlots.map((slot, i) => (
                      <button key={i} onClick={() => setSelectedTime(slot.display)}
                        className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${selectedTime === slot.display ? "bg-primaryGreen text-white border-primaryGreen shadow-md scale-105" : "border-gray-200 text-gray-700 hover:border-primaryGreen hover:bg-green-50"}`}>
                        {slot.display}
                      </button>
                    ))}
                    {takenTimeSlots.map((slot, i) => (
                      <div key={i} className="py-3 px-4 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed" title={slot.reason}>
                        {slot.display}
                      </div>
                    ))}
                  </div>
                </div>
              ) : takenTimeSlots.length > 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                  <p className="text-sm font-semibold text-red-800">Fully booked</p>
                  <p className="text-xs text-red-600 mt-1">No slots available on this date. Please pick another.</p>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 min-h-48">
                  <p className="text-sm text-gray-400">No availability on this date</p>
                </div>
              )
            ) : serviceType === 'occupancy' ? (
              availableTimeSlots.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Select start time:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                    {availableTimeSlots.map((slot, i) => (
                      <button key={i} onClick={() => setSelectedTime(slot.display)}
                        className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${selectedTime === slot.display ? "bg-primaryGreen text-white border-primaryGreen shadow-md scale-105" : "border-gray-200 text-gray-700 hover:border-primaryGreen hover:bg-green-50"}`}>
                        {slot.display}
                      </button>
                    ))}
                    {takenTimeSlots.map((slot, i) => (
                      <div key={i} className="py-3 px-4 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed" title={slot.reason}>
                        {slot.display}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 min-h-48">
                  <p className="text-sm text-gray-400">No available slots for this date</p>
                </div>
              )
            ) : (
              /* Appointment */
              availableTimeSlots.length === 0 && takenTimeSlots.length === 0 ? (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <p className="text-sm text-gray-600">No available slots for this date.</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Select a time:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                    {availableTimeSlots.map((slot, i) => (
                      <button key={i} onClick={() => setSelectedTime(slot.display)}
                        className={`py-3 px-4 rounded-lg border-2 font-medium text-sm transition-all ${selectedTime === slot.display ? "bg-primaryGreen text-white border-primaryGreen shadow-md scale-105" : "border-gray-200 text-gray-700 hover:border-primaryGreen hover:bg-green-50"}`}>
                        {slot.display}
                      </button>
                    ))}
                    {takenTimeSlots.map((slot, i) => (
                      <div key={i} className="py-3 px-4 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed relative group" title={slot.reason}>
                        {slot.display}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {slot.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

        </div>
      </div>

      {/* ── Client Info Form ── */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4 lg:text-base text-sm">Your Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">Full name <span className="text-red-500">*</span></label>
            <input type="text" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs" />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">Email Address <span className="text-red-500">*</span></label>
            <input type="email" name="emailAddress" placeholder="john@example.com" value={formData.emailAddress} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">Mobile number <span className="text-red-500">*</span></label>
            <input type="tel" name="mobileNumber" placeholder="+1 (555) 000-0000" value={formData.mobileNumber} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs" />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">Address</label>
            <input type="text" name="address" placeholder="123 Main St, City, State" value={formData.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">Message (optional)</label>
          <textarea name="message" placeholder="Any special requests or notes..." value={formData.message} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent resize-none md:text-sm text-xs" />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 w-full max-w-md">
            <input type="checkbox" id="policy" checked={agreeToPolicy} onChange={(e) => setAgreeToPolicy(e.target.checked)} className="w-5 h-5 mt-0.5 text-primaryGreen focus:ring-primaryGreen border-gray-300 rounded" />
            <label htmlFor="policy" className="text-sm text-gray-600 flex-1">
              By confirming, you agree to our <span className="font-semibold">Booking Policy</span>
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              !selectedDate ||
              (serviceType === 'appointment' && !selectedTime) ||
              !agreeToPolicy ||
              !formData.fullName ||
              !formData.emailAddress ||
              !formData.mobileNumber ||
              blockedByOccupancy
            }
            className="btn-primary w-full md:w-auto px-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {typeConfig.icon} Confirm {typeConfig.label}
          </button>
        </div>
      </div>
    </div>
  );
}