import React, { useRef, useState } from 'react'
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaLocationDot, FaAngleUp, FaAngleDown, FaRegClock, FaChevronRight } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs"
import { MdQuestionMark, MdEmail } from "react-icons/md"
import { HiOutlineChat } from "react-icons/hi"
import { LuPencil } from "react-icons/lu"

// Mock business data
const businessData = {
  name: "Business Name",
  logo: "",
  phone: "(123) 456-7890",
  email: "test@gmail.com",
  socialMedia: {
    facebook: "https://facebook.com",
    twitter: "https://twitter.com",
    instagram: "https://instagram.com",
    linkedin: "https://linkedin.com"
  },
  tagline: "Tagline or short description of the business goes here.",
  about: "Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore voluptates repellat.",
  location: "123 Business Street, City, State 12345",
  timezone: "UTC-5",
  businessHours: [
    { day: "Monday" },
    { day: "Tuesday" },
    { day: "Wednesday" },
    { day: "Thursday" },
    { day: "Friday" },
    { day: "Saturday" },
    { day: "Sunday" }
  ]
}

export default function BusinessSidebar() {
  const [isEditing, setIsEditing] = useState(false)
  const [isAboutOpen, setIsAboutOpen] = useState(true)
  const [isHoursOpen, setIsHoursOpen] = useState(true)
  const [isLocationOpen, setIsLocationOpen] = useState(true)
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleOpenProfile = () => {
      setShowMobileInfo(true);
    };
    
    window.addEventListener('openMobileProfile', handleOpenProfile);
    
    return () => {
      window.removeEventListener('openMobileProfile', handleOpenProfile);
    };
  }, []);

  const [formData, setFormData] = useState({
    businessName: businessData.name,
    logo: businessData.logo,
    phone: businessData.phone,
    email: businessData.email,
    facebook: businessData.socialMedia.facebook,
    twitter: businessData.socialMedia.twitter,
    instagram: businessData.socialMedia.instagram,
    linkedin: businessData.socialMedia.linkedin,
    tagline: businessData.tagline,
    about: businessData.about,
    location: businessData.location,
    timezone: businessData.timezone,
    businessHours: businessData.businessHours.map(item => ({
        day: item.day,
        startTime: '',
        startPeriod: 'AM',
        endTime: '',
        endPeriod: 'PM',
        enabled: false
    }))
  })

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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSave = () => {
    console.log('Saving profile:', formData)
    setIsEditing(false)
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

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleLogoChange} 
        accept="image/*" 
        className="hidden" 
      />

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
                {FaChevronRight ({size:20, className:"rotate-180"}) }
              </button>
              <span className='text-base font-semibold'>
                {isEditing ? 'Edit Profile' : 'Business Profile'}
              </span>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className='flex items-center gap-1 text-sm text-emerald-600 border border-emerald-600 rounded-full px-3 py-1'
              >
                {LuPencil ({size:14}) }
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Profile Section - Scrollable Content */}
          <div className='bg-white px-6 py-8 flex flex-col items-center'>
            <div className='flex justify-center mb-4 relative'>
              {formData.logo ? (
                <img src={formData.logo} alt={formData.businessName} className='w-20 h-20 rounded-full object-cover' />
              ) : (
                <div className='w-20 h-20 rounded-full bg-gray-300' />
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
                    type="text"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Twitter</label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>Instagram</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                </div>

                <div>
                  <label className='block text-xs font-medium text-gray-700 mb-1'>LinkedIn</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
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
                      <a key={name} href={url} className='text-base'>
                    {Icon({})}
                      </a>
                    ))}
                  </div>
                )}

                <div className='flex flex-col items-center gap-2 text-xs text-gray-600 mb-4'>
                  <div className='flex items-center gap-2'>
                    {BsFillTelephoneFill ({size:12}) }
                    <span>{formData.phone}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {MdEmail ({size:12 })}
                    <span>{formData.email}</span>
                  </div>
                </div>

                <div className='bg-white px-6 pb-4'>
                  <p className='text-sm text-center'>
                    {businessData.tagline}
                  </p>
                  </div>
              </>
            )}

            {!isEditing && (
              <button className='btn-primary items-center'><a href="/services">Book Now</a></button>
            )}
          </div>

          {/* About Section */}
          <div className='bg-white mt-2'>
            <button
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className='w-full px-6 py-4 flex items-center justify-between'
            >
              <div className='flex items-center gap-3'>
                {MdQuestionMark ({size:20,className:"text-gray-700" })}
                <span className='font-semibold'>About</span>
              </div>
              {isAboutOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16})}
            </button>
            {isAboutOpen && (
              <div className='px-6 pb-4'>
                {isEditing ? (
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleChange}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
                  />
                ) : (
                  <p className='text-sm text-gray-600 leading-relaxed'>
                    {formData.about}
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
                {FaRegClock ({size:20, className:"text-gray-700" })}
                <span className='font-semibold'>Business Hours</span>
              </div>
              {isHoursOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16})}
            </button>
            {isHoursOpen && (
              <div className='px-6 pb-4'>
                {isEditing ? (
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
                          <div className='flex items-center w-full gap-2 ml-6'>
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

                    <div className='mt-3'>
                      <label className='block text-xs font-medium text-gray-700 mb-1'>Timezone</label>
                      <input
                        type="text"
                        name="timezone"
                        value={formData.timezone}
                        disabled
                        className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
                      />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {activeBusinessHours.map((item, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span className='text-gray-700'>{item.day.substring(0, 3)}</span>
                        <span className='text-gray-600'>
                          {item.startTime} {item.startPeriod} - {item.endTime} {item.endPeriod}
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
              {isLocationOpen ? FaAngleUp ({size:16}) : FaAngleDown ({size:16})}
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
                    {formData.location}
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
                className='btn-primary w-full'
              >
                Save
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
          {formData.logo ? (
            <img src={formData.logo} alt={formData.businessName} className='w-24 h-24 rounded-full object-cover' />
          ) : (
            <div className='w-24 h-24 rounded-full bg-gray-300' />
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
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Twitter</label>
              <input
                type="text"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>Instagram</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
              />
            </div>

            <div>
              <label className='block text-xs font-medium text-gray-700 mb-1'>LinkedIn</label>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
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
                onChange={handleChange}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm'
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
                  <a key={name} href={url} className='text-base'>
                    {Icon({})}
                  </a>
                ))}
              </div>
            )}

            <div className='mt-2 flex flex-col items-center justify-center text-gray-600'>
              <div className='flex flex-row mb-1 gap-2 items-center'>
                {BsFillTelephoneFill ({className:'text-sm' })}
                <p className='text-xs'>{formData.phone}</p>
              </div>
              <div className='flex flex-row mb-1 gap-2 items-center'>
                {MdEmail ({className:'text-sm' })}
                <p className='text-xs'>{formData.email}</p>
              </div>
            </div>

            <p className='text-sm text-center mt-4 break-words w-full'>
              {formData.tagline}
            </p>

            <button className='btn-primary mt-4'><a href="/">Book Now</a></button>

          </>
        )}

        {/* About Section */}
        <div className='mt-8 w-full pt-4'>
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {MdQuestionMark ({className:"text-gray-900" })}
              <h4 className='text-gray-900 font-semibold text-base'>About</h4>
            </div>
              {isAboutOpen ? FaAngleUp ({}) : FaAngleDown ({})}
          </button>
          
          {isAboutOpen && (
            isEditing ? (
              <textarea
                name="about"
                value={formData.about}
                onChange={handleChange}
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-3 resize-none'
              />
            ) : (
              <p className='text-gray-600 text-sm mt-3 leading-relaxed'>
                {formData.about}
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
              {isHoursOpen ? FaAngleUp ({}) : FaAngleDown ({})}
          </button>

          {isHoursOpen && (
            <div className='mt-4'>
              {isEditing ? (
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
                              className='w-24 px-2 py-1 border border-gray-300 rounded text-xs'
                            />
                          </div>
                          <span className='text-xs text-gray-500'>to</span>
                          <div className='flex items-center gap-1'>
                            <input
                              type="time"
                              value={item.endTime}
                              onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                              className='w-24 px-2 py-1 border border-gray-300 rounded text-xs'
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className='mt-3'>
                    <label className='block text-xs font-medium text-gray-700 mb-1'>Timezone</label>
                    <input
                      type="text"
                      name="timezone"
                      value={formData.timezone}
                      disabled
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed'
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className='space-y-2'>
                    {activeBusinessHours.map((item, index) => (
                      <div key={index} className='flex justify-between text-sm'>
                        <span className='text-gray-700'>{item.day.substring(0, 3)}</span>
                        <span className='text-gray-600'>
                          {item.startTime} {item.startPeriod} - {item.endTime} {item.endPeriod}
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
              {isLocationOpen ? FaAngleUp ({}) : FaAngleDown ({})}
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
                {formData.location}
              </p>
            )
          )}
        </div>

        {/* Save Button - only show when editing */}
        {isEditing && (
          <button 
            onClick={handleSave}
            className='w-full btn-primary mt-8'
          >
            Save
          </button>
        )}
      </div>
    </>
  )
}