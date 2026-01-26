import React, { useRef, useState, useEffect } from 'react'
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaLocationDot, FaAngleUp, FaAngleDown, FaRegClock, FaChevronRight } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs"
import { MdQuestionMark, MdEmail } from "react-icons/md"
import { LuPencil } from "react-icons/lu"
import { authAPI, businessAPI } from '../../utils/api'


export default function BusinessSidebar() {
  const [isEditing, setIsEditing] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(true)
  const [isHoursOpen, setIsHoursOpen] = useState(true)
  const [isLocationOpen, setIsLocationOpen] = useState(true)
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const dayGroups = {
    'weekdays': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    'weekend': ['Saturday', 'Sunday'],
    'all': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  };

  const toggleDaySelection = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const selectDayGroup = (group: 'weekdays' | 'weekend' | 'all') => {
    setSelectedDays(dayGroups[group]);
  };

    const applyBulkHours = () => {
    if (selectedDays.length === 0) {
      alert('Please select at least one day');
      return;
    }

    if (!bulkStartTime || !bulkEndTime) {
      alert('Please set both start and end times');
      return;
    }

    const newHours = [...formData.businessHours];
    selectedDays.forEach(selectedDay => {
      const index = newHours.findIndex(item => item.day === selectedDay);
      if (index !== -1) {
        newHours[index] = {
          ...newHours[index],
          startTime: bulkStartTime,
          endTime: bulkEndTime,
          enabled: true
        };
      }
    });

    setFormData({ ...formData, businessHours: newHours });
    setSelectedDays([]);
  };

  const clearAllHours = () => {
    if (window.confirm('Are you sure you want to clear all business hours?')) {
      setFormData({
        ...formData,
        businessHours: formData.businessHours.map(day => ({
          ...day,
          startTime: '',
          endTime: '',
          enabled: false
        }))
      });
    }
  };


  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    logo: null as File | null,
    logoPreview: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    tagline: '',
    description: '',
    location: '',
    timezone: '',
    category: '',
    businessHours: [
      { day: "Monday", startTime: '', endTime: '', enabled: false },
      { day: "Tuesday", startTime: '', endTime: '', enabled: false },
      { day: "Wednesday", startTime: '', endTime: '', enabled: false },
      { day: "Thursday", startTime: '', endTime: '', enabled: false },
      { day: "Friday", startTime: '', endTime: '', enabled: false },
      { day: "Saturday", startTime: '', endTime: '', enabled: false },
      { day: "Sunday", startTime: '', endTime: '', enabled: false }
    ]
  })

  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false)


  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Toronto', label: 'Toronto (ET)' },
    { value: 'America/Vancouver', label: 'Vancouver (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
    { value: 'Asia/Manila', label: 'Manila (PHT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEDT/AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' }
  ]

  

  useEffect(() => {
    fetchBusinessData()

    const handleOpenProfile = () => {
      setShowMobileInfo(true)
    }
    
    window.addEventListener('openMobileProfile', handleOpenProfile)
    
    return () => {
      window.removeEventListener('openMobileProfile', handleOpenProfile)
    }
  }, [])

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getMe()
      const business = response.data.business

      const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const businessHours = daysOfWeek.map(day => {
        const schedule = business.schedules?.find(s => s.dayOfWeek === day)
         console.log(`🔍 Mapping ${day}:`, schedule)
        return {
          day,
          startTime: schedule?.startTime || '',
          endTime: schedule?.endTime || '',
          enabled: schedule?.enabled || false
        }
      })

      setFormData({
        businessName: business.businessName || '',
        ownerName: business.ownerName || '',
        logo: null,
        logoPreview: business.logo ? `http://localhost:5000${business.logo}` : '',
        phone: business.phone || '',
        email: business.email || '',
        facebook: business.facebook || '',
        twitter: business.twitter || '',
        instagram: business.instagram || '',
        linkedin: business.linkedin || '',
        tagline: business.tagline || '',
        description: business.description || '',
        location: business.location || '',
        timezone: business.timezone || 'Asia/Manila',
        category: business.category || '',
        businessHours
      })
    } catch (err) {
      console.error('Error fetching business data:', err)
      setError('Failed to load business data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTimeChange = (index: number, field: string, value: any) => {
    const newHours = [...formData.businessHours]
    newHours[index] = { ...newHours[index], [field]: value }
    setFormData({ ...formData, businessHours: newHours })
  }

   const handleSelectTimezone = (timezone: string) => {
    setFormData({ ...formData, timezone })
    setIsTimezoneOpen(false)
  }


  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      if (!formData.timezone) {
      setError('Please select a timezone')
      return
      }


      setFormData({ 
        ...formData, 
        logo: file,
        logoPreview: URL.createObjectURL(file)
      })
      setError('')
    }
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)

    try {
      // Create FormData for file upload
      const data = new FormData()
      data.append('ownerName', formData.ownerName)
      data.append('category', formData.category)
      data.append('timezone', formData.timezone)
      data.append('phone', formData.phone)
      data.append('location', formData.location)
      data.append('tagline', formData.tagline)
      data.append('description', formData.description)
      data.append('facebook', formData.facebook)
      data.append('twitter', formData.twitter)
      data.append('instagram', formData.instagram)
      data.append('linkedin', formData.linkedin)

      // ADD THESE DEBUG LOGS 👇
    console.log('🕐 Business Hours before stringify:', formData.businessHours)
    const hoursJSON = JSON.stringify(formData.businessHours)
    console.log('🕐 Business Hours JSON:', hoursJSON)
    data.append('businessHours', hoursJSON)
      
      if (formData.logo) {
        data.append('logo', formData.logo)
      }

      console.log('📤 Sending data to backend...') // ADD THIS
    const response = await businessAPI.updateProfile(data)
    console.log('✅ Response:', response.data) // ADD THIS

      
      console.log('Profile updated:', response.data)
      
      // Refresh data
      await fetchBusinessData()
      
      setIsEditing(false)
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const activeSocialMedia = [
    { name: 'facebook', url: formData.facebook, Icon: FaFacebook },
    { name: 'twitter', url: formData.twitter, Icon: FaXTwitter },
    { name: 'instagram', url: formData.instagram, Icon: FaInstagram },
    { name: 'linkedin', url: formData.linkedin, Icon: FaLinkedin }
  ].filter(social => social.url && social.url.trim() !== '')

  const activeBusinessHours = formData.businessHours.filter(item => 
    item.enabled && item.startTime && item.endTime
  )

  const formatTime = (time: string) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading && !formData.businessName) {
    return (
      <div className='bg-white flex items-center justify-center p-10 border rounded-3xl border-gray-200'>
        <p className='text-gray-500'>Loading...</p>
      </div>
    )
  }

  const getTimezoneLabel = (value: string) => {
    return timezones.find(tz => tz.value === value)?.label || value
  }

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoChange} 
        accept="image/*" 
        className="hidden" 
      />

       {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* MOBILE FULL-SCREEN INFO */}
      {showMobileInfo && (
        <div className='lg:hidden fixed inset-0 bg-white z-[9999] overflow-y-auto'>
          {/* Mobile Header - Fixed */}
          <div className='bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10'>
            <div className='flex items-center justify-between'>
              <button 
                onClick={() => setShowMobileInfo(false)}
                className='p-2 -ml-2'
              >
                {FaChevronRight ({size:20, className:"rotate-180"})}
              </button>
              <span className='text-base font-semibold'>
                {isEditing ? 'Edit Profile' : 'Business Profile'}
              </span>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className='flex items-center gap-1 text-sm text-emerald-600 border border-emerald-600 rounded-full px-3 py-1'
              >
                {LuPencil ({size:14})} 
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Profile Section - Scrollable Content */}
          <div className='bg-white px-6 py-8 flex flex-col items-center'>
            <div className='flex justify-center mb-4 relative'>
              {formData.logoPreview ? (
                <img src={formData.logoPreview} alt={formData.businessName} className='w-20 h-20 rounded-full object-cover' />
              ) : (
                <div className='w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold'>
                  {formData.businessName.charAt(0).toUpperCase()}
                </div>
              )}
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className='absolute bottom-0 right-1/2 translate-x-10 bg-emerald-500 text-white rounded-full p-2 shadow-lg hover:bg-emerald-600 transition'
                >
                {LuPencil ({size:14})} 
                </button>
              )}
            </div>

            {isEditing ? (
              <div className='space-y-4  w-full'>
                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Facebook</label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    placeholder="https://facebook.com/yourpage"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Twitter</label>
                  <input
                    type="url"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="https://twitter.com/yourhandle"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Instagram</label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/yourhandle"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>LinkedIn</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Phone No.</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Tagline</label>
                  <textarea
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className='md:text-lg text-base font-semibold mb-2 text-center'>{formData.businessName}</h1>
                
                {activeSocialMedia.length > 0 && (
                  <div className='flex gap-4 mt-2 mb-2 justify-center'>
                    {activeSocialMedia.map(({ name, url, Icon }) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer" className='text-base hover:text-emerald-600 transition'>
                        {Icon({})}
                      </a>
                    ))}
                  </div>
                )}

                <div className='flex flex-col items-center gap-2 text-xs text-gray-600 mb-4'>
                  {formData.phone && (
                    <div className='flex items-center gap-2'>
                      {BsFillTelephoneFill ({size:12})}
                      <span>{formData.phone}</span>
                    </div>
                  )}
                  {formData.email && (
                    <div className='flex items-center gap-2'>
                      {MdEmail ({size:12})}
                      <span>{formData.email}</span>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <button className='btn-primary items-center'><a href="/services">Book Now</a></button>
                )}
              </>
            )}
          </div>

          {/* About Section */}
          <div className='bg-white mt-2'>
            <button
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className='w-full px-6 py-4 flex items-center justify-between'
            >
              <div className='flex items-center gap-3'>
                {MdQuestionMark ({size:20, className:"text-gray-700"})}
                <span className='font-semibold'>About</span>
              </div>
              {isAboutOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16}) }
            </button>
            {isAboutOpen && (
              <div className='px-6 pb-4'>
                {isEditing ? (
                 <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                ) : (
                 <p className='text-sm text-gray-600 leading-relaxed'>
                    {formData.description || 'No description yet'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Business Hours Section */}
          <div className='bg-white mt-2'>
          <button
            onClick={() => setIsHoursOpen(!isHoursOpen)}
            className='w-full px-6 py-4 flex items-center justify-between'
          >
            <div className='flex items-center gap-3'>
              {FaRegClock ({size:20, className:"text-gray-700"})}
              <span className='font-semibold'>Business Hours</span>
            </div>
            {isHoursOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16}) }
          </button>
          {isHoursOpen && (
            <div className='px-6 pb-4'>
              {isEditing ? (
                <div className='space-y-4'>
                  {/* Quick Set Section */}
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-3">
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <span className="text-emerald-600">⚡</span>
                      Quick Set
                    </h3>

                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button
                        onClick={() => selectDayGroup('weekdays')}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        Mon-Fri
                      </button>
                      <button
                        onClick={() => selectDayGroup('weekend')}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        Weekend
                      </button>
                      <button
                        onClick={() => selectDayGroup('all')}
                        className="px-2.5 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        All Days
                      </button>
                    </div>
              
                    {/* Individual Day Selection */}
                    <div className="mb-3">
                      <div className="grid grid-cols-4 gap-1.5">
                        {formData.businessHours.map((day) => (
                          <button
                            key={day.day}
                            onClick={() => toggleDaySelection(day.day)}
                            className={`px-2 py-1.5 text-xs font-medium rounded border transition ${
                              selectedDays.includes(day.day)
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                            }`}
                          >
                            {day.day.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                      
                    {/* Time Selection */}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                        <input
                          type="time"
                          value={bulkStartTime}
                          onChange={(e) => setBulkStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                        <input
                          type="time"
                          value={bulkEndTime}
                          onChange={(e) => setBulkEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                      
                    {/* Apply Button */}
                    <button
                      onClick={applyBulkHours}
                      disabled={selectedDays.length === 0}
                      className="w-full btn-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Apply to {selectedDays.length > 0 ? `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}` : 'Days'}
                    </button>
                  </div>
                      
                  {/* Individual Schedule */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-700">Individual Hours</span>
                      <button
                        onClick={clearAllHours}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                      
                    <div className='space-y-3'>
                      {formData.businessHours.map((item, index) => (
                        <div key={index} className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => handleTimeChange(index, 'enabled', e.target.checked)}
                              className='w-4 h-4'
                            />
                            <span className='text-sm font-medium'>{item.day}</span>
                          </div>

                          {item.enabled && (
                            <div className='flex items-center gap-2 ml-6'>
                              <input
                                type="time"
                                value={item.startTime}
                                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm'
                              />
                              <span>to</span>
                              <input
                                type="time"
                                value={item.endTime}
                                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm'
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      <div className='pt-3'>
                        <label htmlFor="timezone" className="block text-xs font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                            className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                            disabled={loading}
                          >
                            <span className={formData.timezone ? 'text-gray-800' : 'text-gray-400'}>
                              {formData.timezone ? getTimezoneLabel(formData.timezone) : 'Select timezone'}
                            </span>
                            {isTimezoneOpen ? FaAngleUp ({className:"text-gray-400" }) : FaAngleDown ({className:"text-gray-400" })}
                          </button>
                    
                          {isTimezoneOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {timezones.map((tz) => (
                                <button
                                  key={tz.value}
                                  type="button"
                                  onClick={() => handleSelectTimezone(tz.value)}
                                  className="w-full px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                                >
                                  {tz.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='space-y-2'>
                  {activeBusinessHours.map((item, index) => (
                    <div key={index} className='flex justify-between text-sm'>
                      <span className='text-gray-700'>{item.day.substring(0, 3)}</span>
                      <span className='text-gray-600'>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                    </div>
                  ))}
                  {activeBusinessHours.length === 0 && (
                    <p className='text-sm text-gray-500 italic'>No business hours set</p>
                  )}
                  <p className='text-xs text-gray-500 text-center mt-4 italic'>
                    Time zone ({formData.timezone})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>


          {/* Location Section */}
          <div className='bg-white mt-2'>
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className='w-full px-6 py-4 flex items-center justify-between'
            >
              <div className='flex items-center gap-3'>
                {FaLocationDot ({size:20, className:"text-gray-700"})}
                <span className='font-semibold'>Location</span>
              </div>
              {isLocationOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16}) }

            </button>
            {isLocationOpen && (
              <div className='px-6 pb-4'>
                {isEditing ? (
                  <textarea
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    rows={2}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                ) : (
                  <p className='text-sm text-gray-600'>
                    {formData.location || 'No location set'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer - only show when editing */}
          {isEditing && (
            <div className='px-6 pb-6'>
              <button 
                onClick={handleSave}
                disabled={loading}
                className='btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className='hidden lg:flex bg-white flex-col items-center border rounded-3xl p-10 border-gray-200 w-full relative'>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className='absolute top-4 right-4 flex items-center gap-1 text-sm text-emerald-600 border border-emerald-600 rounded-full px-3 py-1 hover:bg-emerald-50 transition'
        >
          {LuPencil ({size:14})} 
          <span>Edit</span>
        </button>

        <div className='flex justify-center mb-4 relative'>
          {formData.logoPreview ? (
            <img src={formData.logoPreview} alt={formData.businessName} className='w-24 h-24 rounded-full object-cover' />
          ) : (
            <div className='w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-bold'>
              {formData.businessName.charAt(0).toUpperCase()}
            </div>
          )}
          {isEditing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className='absolute bottom-0 right-1/2 translate-x-10 bg-emerald-500 text-white rounded-full p-2 shadow-lg hover:bg-emerald-600 transition'
            >
              {LuPencil ({size:14})} 
            </button>
          )}
        </div>

        {isEditing ? (
          <div className='w-full space-y-4'>
            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                disabled
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Facebook</label>
              <input
                type="url"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/yourpage"
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Twitter</label>
              <input
                type="url"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                placeholder="https://twitter.com/yourhandle"
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Instagram</label>
              <input
                type="url"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/yourhandle"
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>LinkedIn</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/yourcompany"
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Phone No.</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Tagline</label>
              <textarea
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                rows={2}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none'
              />
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-gray-900 text-center font-semibold text-lg break-words">{formData.businessName}</h3>

            {activeSocialMedia.length > 0 && (
              <div className='flex gap-4 mt-2 mb-2'>
                {activeSocialMedia.map(({ name, url, Icon }) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className='text-base hover:text-emerald-600 transition'>
                    {Icon({})}
                  </a>
                ))}
              </div>
            )}

            <div className='mt-2 flex flex-col items-center justify-center text-gray-600'>
              {formData.phone && (
                <div className='flex flex-row mb-1 gap-2 items-center'>
                  {BsFillTelephoneFill ({className:"text-sm"})}
                  <p className='text-xs'>{formData.phone}</p>
                </div>
              )}
              {formData.email && (
                <div className='flex flex-row mb-1 gap-2 items-center'>
                  {MdEmail ({className:"text-sm"})}
                  <p className='text-xs'>{formData.email}</p>
                </div>
              )}
            </div>

            {formData.tagline && (
              <p className='text-sm text-center mt-4 break-words w-full'>
                {formData.tagline}
              </p>
            )}
            
            <button className='btn-primary mt-4'>
              <a href="/">Book Now</a>
            </button>

          </>
        )}

        {/* About Section */}
        <div className='mt-8 w-full pt-4'>
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {MdQuestionMark ({className:"text-gray-900"})}
              <h4 className='text-gray-900 font-semibold text-base'>About</h4>
            </div>
            {isAboutOpen ? FaAngleUp ({}) : FaAngleDown ({}) }

          </button>
          
          {isAboutOpen && (
            isEditing ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-3 resize-none'
              />
            ) : (
              <p className='text-gray-600 text-sm mt-3 leading-relaxed'>
                {formData.description || 'No description yet'}
              </p>
            )
          )}
        </div>

        {/* Business Hours Section */}
        <div className="mt-8 w-full pt-4">
          <button 
            onClick={() => setIsHoursOpen(!isHoursOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {FaRegClock ({className:"text-gray-900" })}
              <h4 className='text-gray-900 font-semibold text-base'>Business Hours</h4>
            </div>
            {isHoursOpen ? FaAngleUp ({}) : FaAngleDown ({}) }
          </button>

          {isHoursOpen && (
            <div className='mt-4'>
              {isEditing ? (
                <div className='space-y-4'>
                  {/* Quick Set Section */}
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-3">
                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <span className="text-emerald-600">⚡</span>
                      Quick Set
                    </h3>

                    {/* Quick Select Buttons */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button
                        onClick={() => selectDayGroup('weekdays')}
                        className="px-2 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        Mon-Fri
                      </button>
                      <button
                        onClick={() => selectDayGroup('weekend')}
                        className="px-2 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        Weekend
                      </button>
                      <button
                        onClick={() => selectDayGroup('all')}
                        className="px-2 py-1 text-xs font-medium bg-white border border-gray-300 rounded hover:bg-emerald-50 hover:border-emerald-500 transition"
                      >
                        All Days
                      </button>
                    </div>
              
                    {/* Individual Day Selection */}
                    <div className="mb-3">
                      <div className="grid grid-cols-4 gap-1.5">
                        {formData.businessHours.map((day) => (
                          <button
                            key={day.day}
                            onClick={() => toggleDaySelection(day.day)}
                            className={`px-2 py-1 text-xs font-medium rounded border transition ${
                              selectedDays.includes(day.day)
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-500'
                            }`}
                          >
                            {day.day.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                      
                    {/* Time Selection */}
                    <div className="space-y-2 mb-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Start</label>
                        <input
                          type="time"
                          value={bulkStartTime}
                          onChange={(e) => setBulkStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">End</label>
                        <input
                          type="time"
                          value={bulkEndTime}
                          onChange={(e) => setBulkEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                      
                    {/* Apply Button */}
                    <button
                      onClick={applyBulkHours}
                      disabled={selectedDays.length === 0}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Apply to {selectedDays.length > 0 ? `${selectedDays.length} day${selectedDays.length > 1 ? 's' : ''}` : 'Days'}
                    </button>
                  </div>
                      
                  {/* Individual Schedule */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-700">Individual Hours</span>
                      <button
                        onClick={clearAllHours}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Clear All
                      </button>
                    </div>
                      
                    <div className='space-y-3'>
                      {formData.businessHours.map((item, index) => (
                        <div key={index} className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <input
                              type="checkbox"
                              checked={item.enabled}
                              onChange={(e) => handleTimeChange(index, 'enabled', e.target.checked)}
                              className='w-4 h-4'
                            />
                            <span className='text-sm font-medium'>{item.day}</span>
                          </div>

                          {item.enabled && (
                            <div className='flex flex-col gap-2 ml-6'>
                              <div className='flex items-center gap-1'>
                                <input
                                  type="time"
                                  value={item.startTime}
                                  onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                                  className='w-full px-2 py-1 border border-gray-300 rounded text-xs'
                                />
                              </div>
                              <span className='text-xs text-gray-500'>to</span>
                              <div className='flex items-center gap-1'>
                                <input
                                  type="time"
                                  value={item.endTime}
                                  onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                                  className='w-f px-2 py-1 border border-gray-300 rounded text-xs'
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      <div className='pt-3'>
                        <label htmlFor="timezone" className="block text-xs font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                            className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                            disabled={loading}
                          >
                            <span className={formData.timezone ? 'text-gray-800' : 'text-gray-400'}>
                              {formData.timezone ? getTimezoneLabel(formData.timezone) : 'Select timezone'}
                            </span>
                            {isTimezoneOpen ? FaAngleUp ({className:"text-gray-400" }) : FaAngleDown ({className:"text-gray-400" })}
                          </button>
                    
                          {isTimezoneOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {timezones.map((tz) => (
                                <button
                                  key={tz.value}
                                  type="button"
                                  onClick={() => handleSelectTimezone(tz.value)}
                                  className="w-full px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
                                >
                                  {tz.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className='space-y-2'>
                    {activeBusinessHours.map((item, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span className='text-gray-700'>{item.day.substring(0, 3)}</span>
                        <span className='text-gray-600'>
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}
                        </span>
                      </div>
                    ))}
                    {activeBusinessHours.length === 0 && (
                      <p className='text-sm text-gray-500 italic'>No business hours set</p>
                    )}
                  </div>
                  <p className='text-xs text-gray-600 text-center mt-6 italic opacity-70'>
                      Time zone ({formData.timezone})
                  </p>
                </>
              )}
            </div>
          )}
        </div>

    {/* Location Section */}
    <div className='mt-8 w-full pt-4'>
      <button 
        onClick={() => setIsLocationOpen(!isLocationOpen)}
        className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
      >
        <div className='flex items-center gap-2'>
          {FaLocationDot ({className:"text-gray-900"})}
          <h4 className='text-gray-900 font-semibold text-base'>Location</h4>
        </div>
        {isLocationOpen ? FaAngleUp ({}) : FaAngleDown ({}) }
      </button>
      
      {isLocationOpen && (
        isEditing ? (
          <textarea
            name="location"
            value={formData.location}
            onChange={handleChange}
            rows={2}
            className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-3 resize-none'
          />
        ) : (
          <p className='text-gray-600 text-sm mt-3'>
            {formData.location || 'No location set'}
          </p>
        )
      )}
    </div>

    {/* Save Button - only show when editing */}
    {isEditing && (
      <button 
        onClick={handleSave}
        disabled={loading}
        className='w-full btn-primary mt-8'
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    )}
  </div>
  </>
  )
}
