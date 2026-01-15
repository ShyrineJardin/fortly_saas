import React, { useState } from 'react'
import { FaAngleUp, FaAngleDown } from 'react-icons/fa6'

export default function Onboarding() {
  const [formData, setFormData] = useState({
    businessName: '',
    fullName: '',
    businessType: '',
    timezone: '',
    phone: '',
    location: '',
    tagline: '',
    about: ''
  })

  const [isBusinessTypeOpen, setIsBusinessTypeOpen] = useState(false)
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false)

  const businessTypes = [
    'Salon / Spa',
    'Restaurant',
    'Retail Store',
    'Fitness Center',
    'Consulting',
    'Photography',
    'Other'
  ]

  const timezone = [
    'UTC +10:30',
    'UTC +09:00',
    'UTC +08:00',
    'UTC +07:00',
    'UTC +06:00'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectBusinessType = (type: string) => {
    setFormData({ ...formData, businessType: type })
    setIsBusinessTypeOpen(false)
  }

  const handleSelectTimezone = (timezone: string) => {
    setFormData({ ...formData, timezone: timezone })
    setIsTimezoneOpen(false)
  }

  const handleSubmit = () => {
    console.log('Onboarding submitted:', formData)
    // Add your onboarding logic here
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-10">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="lg:text-3xl text-2xl font-semibold mb-1">
            Great! Tell us about your business 🚀
          </h1>
          <p className="text-textSecondaryColor lg:text-base text-sm mb-6">
            Let's introduce your business to your future clients
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Row 1: Business Owner & Business Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name Input */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter business name"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Business Type & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Type Dropdown */}
            <div>
              <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
                What type of business are you? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBusinessTypeOpen(!isBusinessTypeOpen)}
                  className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                >
                  <span className={formData.businessType ? 'text-gray-800' : 'text-gray-400'}>
                    {formData.businessType || 'Salon / Spa'}
                  </span>
                  {FaAngleUp({ size: '1.25rem', className: `w-5 h-5 text-gray-400 transition-transform ${isBusinessTypeOpen ? 'rotate-180' : ''}` })}
                </button>
                
                {isBusinessTypeOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {businessTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleSelectBusinessType(type)}
                        className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Timezone Dropdown */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                Timezone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                  className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                >
                  <span className={formData.timezone ? 'text-gray-800' : 'text-gray-400'}>
                    {formData.timezone || 'UTC +1'}
                  </span>
                  {isTimezoneOpen ? FaAngleUp({ size: '1.25rem', className: 'text-gray-400' }) : FaAngleDown({ size: '1.25rem', className: 'text-gray-400' })}
                </button>

                {isTimezoneOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {timezone.map((timezone) => (
                      <button
                        key={timezone}
                        type="button"
                        onClick={() => handleSelectTimezone(timezone)}
                        className="w-full px-4 py-2 text-left hover:bg-emerald-50 transition-colors"
                      >
                        {timezone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Details Divider */}
          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Optional details</h3>
          </div>

          {/* Row 3: Phone Number & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Row 4: Tagline & Short Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tagline */}
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <textarea
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="Message"
                rows={4}
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">
                Short description
              </label>
              <textarea
                id="about"
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Message"
                rows={4}
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              className="btn-primary w-full"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}