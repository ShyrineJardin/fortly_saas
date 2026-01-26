import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import BookingPolicy from "../shared/BookingPolicy";
import ServiceCard from "../shared/ServiceCard";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { authAPI } from "../../utils/api";

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    fullName: "",
    emailAddress: "",
    mobileNumber: "",
    address: "",
    message: ""
  });
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);

  // Business data from API
  const [businessData, setBusinessData] = useState<any>(null);
  const [bookingPolicy, setBookingPolicy] = useState({
    title: "Booking Policy",
    description: "",
    policyList: [] as string[]
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedService = location.state?.selectedService;

  useEffect(() => {
    loadBusinessData();
  }, []);

  useEffect(() => {
    if (selectedDate && businessData) {
      generateTimeSlots(selectedDate);
    }
  }, [selectedDate, businessData]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getMe();
      const business = response.data.business;
      
      console.log('📊 Loaded Business Data:', {
        schedules: business.schedules,
        bufferTime: business.bufferTime,
        timezone: business.timezone
      });
      
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

  const generateTimeSlots = (date: Date) => {
    if (!businessData) return;

    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = businessData.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);

    console.log('🕐 Generating slots for:', { dayOfWeek, daySchedule });

    if (!daySchedule || !daySchedule.enabled) {
      setAvailableTimeSlots([]);
      return;
    }

    // Parse service duration
    const serviceDuration = parseInt(selectedService.duration.match(/\d+/)?.[0] || '60');
    
    // Parse buffer time
    const bufferMatch = businessData.bufferTime?.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    let bufferMinutes = 15; // default
    
    if (bufferMatch) {
      const value = parseFloat(bufferMatch[1]);
      const unit = bufferMatch[2];
      
      switch(unit) {
        case 'minutes': bufferMinutes = value; break;
        case 'hours': bufferMinutes = value * 60; break;
        case 'days': bufferMinutes = value * 24 * 60; break;
        case 'weeks': bufferMinutes = value * 7 * 24 * 60; break;
        case 'months': bufferMinutes = value * 30 * 24 * 60; break;
      }
    }

    console.log('⏱️ Time calculation:', { serviceDuration, bufferMinutes });

    // Generate time slots
    const slots: string[] = [];
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const slotInterval = serviceDuration + bufferMinutes;

    while (currentMinutes + serviceDuration <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const minute = currentMinutes % 60;
      
      // Convert to 12-hour format
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const timeString = `${displayHour}:${String(minute).padStart(2, '0')} ${ampm}`;
      
      slots.push(timeString);
      currentMinutes += slotInterval;
    }

    console.log('✅ Generated slots:', slots);
    setAvailableTimeSlots(slots);
  };

  const getMinAdvanceDays = () => {
    if (!businessData?.bufferTime) return 0;
    
    const bufferMatch = businessData.bufferTime.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    if (!bufferMatch) return 0;
    
    const value = parseFloat(bufferMatch[1]);
    const unit = bufferMatch[2];
    
    switch(unit) {
      case 'minutes':
      case 'hours':
        return 0; // Same day booking allowed
      case 'days':
        return Math.ceil(value);
      case 'weeks':
        return Math.ceil(value * 7);
      case 'months':
        return Math.ceil(value * 30);
      default:
        return 0;
    }
  };

  const isDateSelectable = (day: number | null) => {
    if (!day || !businessData) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't select past dates
    if (date < today) return false;
    
    // Check minimum advance booking requirement
    const minAdvanceDays = getMinAdvanceDays();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minAdvanceDays);
    
    if (date < minDate) return false;
    
    // Check if business is open on this day
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = businessData?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
    
    return daySchedule?.enabled || false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
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

    navigate(`/${businessSlug}/confirmation`, { 
      state: { 
        selectedService: selectedService,
        bookingDetails: { 
          date: selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: selectedTime,
          ...formData
        }
      }
    });
  };

  const handleBackClick = () => {
    navigate(`/${businessSlug}/services`);
  };

  // Calendar navigation
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

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  if (!selectedService) {
    return <Navigate to={`/${businessSlug}/services`} replace />;
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const minAdvanceDays = getMinAdvanceDays();
  const showAdvanceNotice = minAdvanceDays > 0;

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 border-b border-gray-100 w-full pb-4">
        <button 
          onClick={handleBackClick}
          className="flex items-center gap-2 hover:opacity-70 transition"
        >
          <FaChevronLeft size={16} />
          <span className="text-sm lg:text-base font-semibold">Booking details</span>
        </button>
      </div>

      {/* Booking Policy Section */}
      <BookingPolicy 
        title={bookingPolicy.title}
        description={bookingPolicy.description}
        policyList={bookingPolicy.policyList}
      />

      {/* Service Card */}
      <ServiceCard 
        id={selectedService.id}
        title={selectedService.title}
        duration={selectedService.duration}
        price={selectedService.price}
        description={selectedService.description}
        image={selectedService.image}
        showArrow={false}
      />

      {/* Date and Time Selection */}
      <div className="mb-6"> 
        <h2 className="font-semibold mb-4 lg:text-base text-sm">Select date and time</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {/* Month/Year Header with Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={previousMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Previous month"
              >
                <FaChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <h3 className="text-base font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              
              <button 
                onClick={nextMonth} 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Next month"
              >
                <FaChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
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

            {/* Info Footer */}
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

          {/* Time Selection Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                  : 'Select a date'
                }
              </h3>
              {selectedDate && (
                <p className="text-xs text-gray-500">
                  Available time slots for your appointment
                </p>
              )}
            </div>

            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Select a date to see available times</p>
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-1">No available slots</p>
                <p className="text-gray-500 text-sm">Please select another date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                {availableTimeSlots.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(time)}
                    className={`
                      py-3 px-4 rounded-lg border-2 font-medium text-sm
                      transition-all duration-200
                      ${selectedTime === time
                        ? "bg-primaryGreen text-white border-primaryGreen shadow-md scale-105"
                        : "border-gray-200 text-gray-700 hover:border-primaryGreen hover:bg-green-50 hover:scale-105"
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact Form */}
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
          <div className="flex items-start gap-3 w-full max-w-md">
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
            className="btn-primary w-full md:w-auto px-12 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}