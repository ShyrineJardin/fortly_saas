import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaCalendar } from "react-icons/fa6";
import BookingPolicy from "../shared/BookingPolicy";
import ServiceCard from "../shared/ServiceCard";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { authAPI, bookingsAPI } from "../../utils/api";

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState("");
  const [takenTimeSlots, setTakenTimeSlots] = useState<any[]>([]);

  // ✅ NEW: Submitting state for clean loading screen
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    emailAddress: "",
    mobileNumber: "",
    address: "",
    message: ""
  });
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);

  const [businessData, setBusinessData] = useState<any>(null);
  const [bookingPolicy, setBookingPolicy] = useState({
    title: "Booking Policy",
    description: "",
    policyList: [] as string[]
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [minAdvanceDays, setMinAdvanceDays] = useState(0);

  const selectedService = location.state?.selectedService;

  useEffect(() => {
    loadBusinessData();
  }, []);

  useEffect(() => {
    if (selectedDate && businessData && selectedService) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, businessData, selectedService]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      const business = response.data.business;
      
      setBusinessData(business);
      setBookingPolicy({
        title: business.bookingPolicyTitle || "Booking Policy",
        description: business.bookingPolicyDescription || "",
        policyList: business.bookingPolicyList || []
      });
    } catch (err) {
      console.error('Error loading business data:', err);
      setError('Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: Date) => {
    if (!selectedService || !businessSlug) return;

    try {
      setLoadingSlots(true);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const response = await bookingsAPI.getAvailableSlots(
        businessSlug,
        formattedDate,
        { serviceId: selectedService.id }
      );

      setAvailableTimeSlots(response.data.availableSlots || []);
      setTakenTimeSlots(response.data.takenSlots || []);
      setMinAdvanceDays(response.data.minAdvanceDays || 0);
      setSelectedTime(null);

    } catch (err: any) {
      console.error('❌ Error fetching slots:', err);
      setError(err.response?.data?.message || 'Failed to fetch available times');
      setAvailableTimeSlots([]);
      setTakenTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const isDateSelectable = (day: number | null) => {
    if (!day || !businessData) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minAdvanceDays);
    
    if (date < minDate) return false;
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = businessData?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
    
    return daySchedule?.enabled || false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError("Please select a date and time");
      return;
    }

    if (!formData.fullName || !formData.emailAddress || !formData.mobileNumber) {
      setError("Please fill in all required fields");
      return;
    }

    if (!agreeToPolicy) {
      setError("Please agree to the booking policy");
      return;
    }

    try {
      // ✅ Set submitting state - this will hide sidebar
      setSubmitting(true);

      const selectedSlot = availableTimeSlots.find(slot => slot.display === selectedTime);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedBookingDate = `${year}-${month}-${day}`;

      const bookingData = {
        businessSlug,
        serviceId: selectedService.id,
        clientName: formData.fullName,
        clientEmail: formData.emailAddress,
        clientPhone: formData.mobileNumber,
        clientAddress: formData.address,
        bookingDate: formattedBookingDate,
        bookingTime: selectedSlot?.time || selectedTime,
        notes: formData.message,
        syncToClientCalendar: syncToCalendar
      };

      console.log('📤 Submitting booking:', bookingData);

      const response = await bookingsAPI.create(bookingData);

      console.log('✅ Booking created:', response.data);

      navigate(`/${businessSlug}/confirmation`, { 
        state: { 
          selectedService: selectedService,
          booking: response.data.booking,
          bookingDetails: { 
            date: selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: selectedTime,
            ...formData
          },
          hasChatHistory: response.data.hasChatHistory,
          chatMessageCount: response.data.chatMessageCount,
          calendarSync: response.data.calendarSync
        }
      });

    } catch (err: any) {
      console.error('❌ Booking error:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
      setSubmitting(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/${businessSlug}/services`);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!selectedService) {
    return <Navigate to={`/${businessSlug}/services`} replace />;
  }

  // Clean loading screen during submission of booking
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const showAdvanceNotice = minAdvanceDays > 0;

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 border-b border-gray-100 w-full pb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center gap-2 hover:opacity-70 transition"
        >
          {FaChevronLeft ({size:16})}
          <span className="text-sm lg:text-base font-semibold">Booking details</span>
        </button>
      </div>

      <BookingPolicy 
        title={bookingPolicy.title}
        description={bookingPolicy.description}
        policyList={bookingPolicy.policyList}
      />

      <ServiceCard 
        id={selectedService.id}
        title={selectedService.title}
        duration={selectedService.duration}
        price={selectedService.price}
        description={selectedService.description}
        image={selectedService.image}
        showArrow={false}
      />

      <div className="mb-6"> 
        <h2 className="font-semibold mb-4 lg:text-base text-sm">Select date and time</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={previousMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {FaChevronLeft ({className:"w-5 h-5 text-gray-600" })}
              </button>
              
              <h3 className="text-base font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button 
                onClick={nextMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {FaChevronRight ({className:"w-5 h-5 text-gray-600" })}
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = new Date().toDateString() === date.toDateString();
                const isSelectable = isDateSelectable(day);
                
                return (
                  <button
                    key={day}
                    onClick={() => isSelectable && setSelectedDate(date)}
                    disabled={!isSelectable}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg font-medium
                      transition-all duration-200
                      ${isSelected 
                        ? 'bg-primaryGreen text-white shadow-md scale-105' 
                        : isToday
                        ? 'border-2 border-primaryGreen text-primaryGreen bg-green-50'
                        : isSelectable
                        ? 'hover:bg-gray-100 hover:scale-105 text-gray-700'
                        : 'text-gray-300 cursor-not-allowed bg-gray-50'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                🕐 Timezone: {businessData?.timezone || 'UTC'}
              </p>
              
              {showAdvanceNotice && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 text-center font-medium">
                    ⓘ Bookings require {minAdvanceDays} {minAdvanceDays === 1 ? 'day' : 'days'} advance notice
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4">
            {availableTimeSlots.map((slot, index) => (
              <button
                key={`available-${index}`}
                onClick={() => setSelectedTime(slot.display)}
                className={`
                  py-3 px-4 rounded-lg border-2 font-medium text-sm
                  transition-all duration-200
                  ${selectedTime === slot.display
                    ? "bg-primaryGreen text-white border-primaryGreen shadow-md scale-105"
                    : "border-gray-200 text-gray-700 hover:border-primaryGreen hover:bg-green-50 hover:scale-105"
                  }
                `}
              >
                {slot.display}
              </button>
            ))}

            {takenTimeSlots.map((slot, index) => (
              <div
                key={`taken-${index}`}
                className="py-3 px-4 rounded-lg border-2 border-gray-200 bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed relative group"
                title={slot.reason}
              >
                {slot.display}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {slot.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="font-semibold mb-4 lg:text-base text-sm">Your Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs"
            />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="emailAddress"
              placeholder="john@example.com"
              value={formData.emailAddress}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">
              Mobile number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="mobileNumber"
              placeholder="+1 (555) 000-0000"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs"
            />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="123 Main St, City, State"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent md:text-sm text-xs"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block md:text-sm text-xs font-medium mb-2 text-gray-700">
            Message (optional)
          </label>
          <textarea
            name="message"
            placeholder="Any special requests or notes..."
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent resize-none md:text-sm text-xs"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 w-full max-w-md">
            <input
              type="checkbox"
              id="policy"
              checked={agreeToPolicy}
              onChange={(e) => setAgreeToPolicy(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-primaryGreen focus:ring-primaryGreen border-gray-300 rounded"
            />
            <label htmlFor="policy" className="text-sm text-gray-600 flex-1">
              By confirming, you agree to our <span className="font-semibold">Booking Policy</span>
            </label>
          </div>


          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !agreeToPolicy || !formData.fullName || !formData.emailAddress || !formData.mobileNumber}
            className="btn-primary w-full md:w-auto px-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}