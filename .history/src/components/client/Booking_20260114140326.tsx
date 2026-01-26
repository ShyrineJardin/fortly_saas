import React, { useState } from "react";
import { FaChevronLeft, FaClock, FaLocationDot } from "react-icons/fa6";
import { FaAngleUp, FaAngleDown } from "react-icons/fa6";
import { CiCircleChevRight } from "react-icons/ci";

export default function Booking() {
const [isOpen, setIsOpen] = useState(false);

const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    emailAddress: "",
    mobileNumber: "",
    address: "",
    message: ""
  });
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);

  // Sample dates for December 2023
  const dates = [
    { day: "Thu", date: "Dec 2" },
    { day: "Fri", date: "Dec 3" },
    { day: "Sat", date: "Dec 4" },
    { day: "Sun", date: "Dec 5" },
  ];

  const times = [
    "10:00 AM", "11:00 AM", "10:30 AM", "12:00 PM",
    "10:30 AM", "01:00 PM", "02:00 PM", "02:00 PM",
    "02:30 PM", "03:00 PM"
  ];

  const businessHours = [
    { day: "Sunday", hours: "10 AM - 6 PM" },
    { day: "Monday", hours: "10 AM - 6 PM" },
    { day: "Tuesday", hours: "10 AM - 6 PM" },
    { day: "Wednesday", hours: "10 AM - 6 PM" },
    { day: "Thursday", hours: "10 AM - 6 PM" },
    { day: "Friday", hours: "10 AM - 6 PM" },
    { day: "Saturday", hours: "10 AM - 6 PM" },
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log({ ...formData, selectedDate, selectedTime, agreeToPolicy });
    // Handle booking submission
  };


  return (
    <div>
      <div>
        {/* Header */}
        <div className="mb-6 border-b border-gray-100 w-full">
          <button className="flex items-center gap-2 mb-4"><a href="/services">{FaChevronLeft({size: 16})}</a>
            <span className="text-base font-semibold">Booking details</span>
          </button>
        </div>

        <div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Booking Policy */}
            <div className="bg-policyBackground p-6 rounded-2xl border border-policyBorder gap-4 flex flex-col mb-6">
                <h2 className="text-base font-semibold">Booking Policy</h2>
                <div className="text-policyBodyText text-sm">
                <p>Our booking policy ensures that all appointments are scheduled fairly and efficiently.</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>All bookings must be made at least 24 hours in advance.</li>
                    <li>Cancellations must be made at least 12 hours prior.</li>
                </ol>
                </div>
            </div>

            {/* Service Card */}
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  {/* Image Placeholder */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0" />
                  
                  {/* Text Content */}
                  <div>
                    <h3 className="text-base font-semibold">Service Card</h3>
                    <p className="text-sm">25 mins . PHP 1,500.00</p>
                    <button 
                      onClick={() => setIsOpen(!isOpen)}
                      className="text-sm flex items-center gap-1 mt-1 hover:underline"
                    >
                      More Details 
                      {isOpen ? FaAngleUp({size: 14}) : FaAngleDown({size: 14})}
                    </button>
                  </div>
                </div>
    
               </div> 
    
            {/* Expandable Details Area */}
              {isOpen && (
                <div className="mt-4 border-t border-gray-50 text-sm text-gray-600 animate-in fade-in slide-in-from-top-1">
                  Lorem ipsum dolor sit amet. Qui ullam rerum est voluptas consequatur eum asperiores aliquam est maxime doloremque. Hic blanditiis debitis et dolores voluptate ut repudiandae necessitatibus et sint voluptatibus.
                </div>
              )}
            </div> 

            {/* Date and Time Selection */}
            <div className="mb-6"> 
              <h2 className="font-semibold mb-3 text-base">Select date and time</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calendar Section */}
                <div className="border border-gray-200 rounded-xl p-6">
                  {/* Selected Date Display */}
                  <div className="mb-3 pb-2 border-b border-gray-200">
                    <div className="text-lg font-semibold">Thu, Dec 2</div>
                  </div>

                  {/* Month/Year Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">December 2023</span>
                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
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
                      {[...Array(31)].map((_, index) => {
                        const day = index + 1;
                        const isSelected = day === 5;
                        const isToday = day === 2;
                        const isEmpty = index === 0; // First day starts on different weekday
                        
                        if (day > 31) return <div key={index} />;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedDate(day)}
                            className={`
                              aspect-square flex items-center justify-center text-sm rounded-full
                              transition-colors
                              ${isSelected 
                                ? 'bg-primaryGreen text-white font-semibold' 
                                : isToday
                                ? 'border-2 border-primaryGreen text-primaryGreen font-semibold'
                                : 'hover:bg-gray-100'
                              }
                              ${day < 2 ? 'text-gray-300' : ''}
                            `}
                          >
                            {day}
                          </button>
                        );
                      })}
                      <div className="text-center text-sm text-gray-400">31</div>
                    </div>
                  </div>
                </div>

                {/* Time Selection Section */}
                <div>
                  <div className="text-sm font-medium mb-4">December 14, 2023</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {times.map((time, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTime(time)}
                        className={`w-full py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
                          selectedTime === time
                            ? "bg-primaryGreen text-white border-primaryGreen"
                            : "border-gray-200 hover:border-primaryGreen hover:bg-gray-50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-7 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    name="emailAddress"
                    placeholder="Email Address"
                    value={formData.emailAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-7 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mobile number</label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    placeholder="Mobile number"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Message (optional)</label>
                <textarea
                  name="message"
                  placeholder="Notes / Message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen resize-none text-sm"
                />
              </div>

            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="policy"
                  checked={agreeToPolicy}
                  onChange={(e) => setAgreeToPolicy(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="policy" className="text-xs text-gray-600">
                  By confirming, you agree to our Booking Policy
                </label>
              </div>
              
              <a href="/confirmation">
              <button
                onClick={handleSubmit}
                className="btn-primary w-1/2"
              >
                Done
              </button>
              </a>
            </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}