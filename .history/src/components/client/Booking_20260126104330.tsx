import React, { useState, useEffect } from "react";
import { FaChevronLeft } from "react-icons/fa6";
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
      }
    }

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

    setAvailableTimeSlots(slots);
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
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
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

  const isDateSelectable = (day: number | null) => {
    if (!day) return false;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Can't select past dates
    if (date < today) return false;
    
    // Parse buffer time to get minimum advance booking days
    let minAdvanceDays = 0;
    const bufferMatch = businessData?.bufferTime?.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    
    if (bufferMatch) {
      const value = parseFloat(bufferMatch[1]);
      const unit = bufferMatch[2];
      
      // Convert buffer time to days
      switch(unit) {
        case 'minutes':
        case 'hours':
          minAdvanceDays = 0; // Same day booking allowed
          break;
        case 'days':
          minAdvanceDays = Math.ceil(value);
          break;
        case 'weeks':
          minAdvanceDays = Math.ceil(value * 7);
          break;
        case 'months':
          minAdvanceDays = Math.ceil(value * 30);
          break;
      }
    }
    
    // Check if date is far enough in advance
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minAdvanceDays);
    
    if (date < minDate) return false;
    
    // Check if business is open on this day
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = businessData?.schedules?.find((s: any) => s.dayOfWeek === dayOfWeek);
    
    return daySchedule?.enabled || false;
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

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 border-b border-gray-100 w-full">
        <button 
          onClick={handleBackClick}
          className="flex items-center gap-2 mb-4 hover:opacity-70"
        >
          FaChevronLeft size={16} />
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
        <h2 className="font-semibold mb-3 lg:text-base text-sm">Select date and time</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div className="border border-gray-200 rounded-xl p-6">
            {/* Selected Date Display */}
            <div className="mb-3 pb-2 border-b border-gray-200">
              <div className="text-lg font-semibold">
                {selectedDate 
                  ? selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  : 'Select a date'
                }
              </div>
            </div>

            {/* Month/Year Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={previousMonth} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-2">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 font-medium py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth().map((day, index) => {
                  if (day === null) {
                    return <div key={index} />;
                  }

                  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = new Date().toDateString() === date.toDateString();
                  const isSelectable = isDateSelectable(day);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => isSelectable && setSelectedDate(date)}
                      disabled={!isSelectable}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-full
                        transition-colors
                        ${isSelected 
                          ? 'bg-primaryGreen text-white font-semibold' 
                          : isToday
                          ? 'border-2 border-primaryGreen text-primaryGreen font-semibold'
                          : isSelectable
                          ? 'hover:bg-gray-100'
                          : 'text-gray-300 cursor-not-allowed'
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Timezone Display */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Timezone: {businessData?.timezone || 'UTC'}
            </p>
            
            {/* Buffer Time Notice */}
            {businessData?.bufferTime && (() => {
              const bufferMatch = businessData.bufferTime.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
              if (bufferMatch) {
                const value = parseFloat(bufferMatch[1]);
                const unit = bufferMatch[2];
                
                // Only show notice for advance booking (days, weeks, months)
                if (unit === 'days' || unit === 'weeks' || unit === 'months') {
                  return (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 text-center">
                      ⓘ Bookings require {value} {unit} advance notice
                    </div>
                  );
                }
              }
              return null;
            })()}
          </div>

          {/* Time Selection Section */}
          <div>
            <div className="text-sm font-medium mb-4">
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'Select a date first'
              }
            </div>

            {!selectedDate ? (
              <div className="text-center py-8 text-gray-500">
                Please select a date to see available times
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available time slots for this day
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availableTimeSlots.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(time)}
                    className={`w-full py-3 px-4 rounded-lg border md:text-sm text-xs font-medium transition-colors ${
                      selectedTime === time
                        ? "bg-primaryGreen text-white border-primaryGreen"
                        : "border-gray-200 hover:border-primaryGreen hover:bg-gray-50"
                    }`}
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
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2">Full name *</label>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen md:text-sm text-xs"
            />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2">Email Address *</label>
            <input
              type="email"
              name="emailAddress"
              placeholder="Email Address"
              value={formData.emailAddress}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen md:text-sm text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2">Mobile number *</label>
            <input
              type="tel"
              name="mobileNumber"
              placeholder="Mobile number"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen md:text-sm text-xs"
            />
          </div>
          <div>
            <label className="block md:text-sm text-xs font-medium mb-2">Address</label>
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen md:text-sm text-xs"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block md:text-sm text-xs font-medium mb-2">Message (optional)</label>
          <textarea
            name="message"
            placeholder="Notes / Message"
            value={formData.message}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen resize-none md:text-sm text-xs"
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="policy"
              checked={agreeToPolicy}
              onChange={(e) => setAgreeToPolicy(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="policy" className="text-xs text-gray-600">
              By confirming, you agree to our Booking Policy
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || !agreeToPolicy}
            className="btn-primary w-full md:w-1/2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}