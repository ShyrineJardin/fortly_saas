import React, { useState, useEffect } from 'react'
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaLocationDot, FaAngleUp, FaAngleDown, FaRegClock, FaChevronRight } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdQuestionMark, MdEmail } from "react-icons/md";
import { HiOutlineChat } from "react-icons/hi";
import { HiCalendar } from "react-icons/hi2";
import { businessAPI } from '../../utils/api';
import { useParams,  useNavigate } from 'react-router-dom';

export default function ClientSidebar() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const navigate = useNavigate();
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isHoursOpen, setIsHoursOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [showMobileInfo, setShowMobileInfo] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessData();
  }, [businessSlug]);

  const fetchBusinessData = async () => {
    try {
      setLoading(true);
      const response = await businessAPI.getBySlug(businessSlug || '');
      setBusinessData(response.data.business);
    } catch (error) {
      console.error('Error fetching business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    navigate(`/${businessSlug}/services`);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const activeSocialMedia = businessData ? [
    { name: 'facebook', url: businessData.facebook, Icon: FaFacebook },
    { name: 'twitter', url: businessData.twitter, Icon: FaXTwitter },
    { name: 'instagram', url: businessData.instagram, Icon: FaInstagram },
    { name: 'linkedin', url: businessData.linkedin, Icon: FaLinkedin }
  ].filter(social => social.url && social.url.trim() !== '') : [];

  const activeBusinessHours = businessData?.schedules?.filter((item: any) => 
    item.enabled && item.startTime && item.endTime
  ).sort((a: any, b: any) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek);
  }) || [];

  if (loading) {
    return (
      <div className='bg-white flex items-center justify-center p-10 border rounded-3xl border-gray-200'>
        <p className='text-gray-500'>Loading...</p>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className='bg-white flex items-center justify-center p-10 border rounded-3xl border-gray-200'>
        <p className='text-gray-500'>Business not found</p>
      </div>
    );
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className='lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40'>
        <div className='flex items-center justify-between'>
          <button 
            onClick={() => setShowMobileInfo(true)}
            className='flex items-center gap-3'
          >
            {businessData.logo ? (
              <img 
                src={businessData.logo} 
                alt={businessData.businessName} 
                className='w-10 h-10 rounded-full object-cover' 
              />
            ) : (
              <div className='w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold'>
                {businessData.businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <h3 className="font-semibold md:text-base text-sm">{businessData.businessName}</h3>
            {FaChevronRight({size: 16, className: "text-gray-600"})}
          </button>

          <div className="">
            <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openAppointment'))} 
            className='p-2'
            >
            {HiCalendar({size: 28})}
            </button>

            <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} 
            className='p-2'
            >
            {HiOutlineChat({size: 28})}
            </button>

          </div>
          
          
        </div>
      </div>

      {/* MOBILE FULL-SCREEN INFO */}
      {showMobileInfo && (
        <div className='lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto'>
          <div className='bg-white border-b border-gray-200 px-4 py-3 sticky top-0'>
            <div className='flex items-center justify-between'>
              <button 
                onClick={() => setShowMobileInfo(false)}
                className='p-2 -ml-2'
              >
                {FaChevronRight({size: 20, className: "rotate-180"})}
              </button>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} 
                className='p-2'
              >
                {HiOutlineChat({size: 28})}
              </button>            
            </div>
          </div>

          <div className='bg-white px-6 py-8 text-center'>
            <div className='flex justify-center mb-4'>
              {businessData.logo ? (
                <img 
                  src={businessData.logo}
                  alt={businessData.businessName} 
                  className='w-20 h-20 rounded-full object-cover' 
                />
              ) : (
                <div className='w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl font-bold'>
                  {businessData.businessName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className='md:text-lg text-base font-semibold mb-2'>{businessData.businessName}</h1>
            
            {activeSocialMedia.length > 0 && (
              <div className='flex justify-center gap-4 mb-4'>
                {activeSocialMedia.map(({ name, url, Icon }) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer" className='text-gray-700 hover:text-emerald-600 transition'>
                    {Icon({size: '1rem'})}
                  </a>
                ))}
              </div>
            )}

            <div className='flex flex-col items-center gap-2 text-xs text-gray-600 mb-4'>
              {businessData.phone && (
                <a 
                  href={`tel:${businessData.phone}`}
                  className='flex items-center gap-2 hover:text-emerald-600 transition'
                >
                  {BsFillTelephoneFill({size: 12})}
                  <span>{businessData.phone}</span>
                </a>
              )}
              {businessData.email && (
                <a 
                  href={`mailto:${businessData.email}`}
                  className='flex items-center gap-2 hover:text-emerald-600 transition'
                >
                  {MdEmail({size: 12})}
                  <span>{businessData.email}</span>
                </a>
              )}
            </div>

            {businessData.tagline && (
              <div className='bg-white px-6 pb-4'>
                <p className='text-sm text-center'>
                  {businessData.tagline}
                </p>
              </div>
            )}

            <button className='btn-primary max-w-xs' onClick={handleBookNow}>
              Book Now
            </button>
          </div>

          {/* About Section */}
          <div className='bg-white mt-2'>
            <button
              onClick={() => setIsAboutOpen(!isAboutOpen)}
              className='w-full px-6 py-4 flex items-center justify-between'
            >
              <div className='flex items-center gap-3'>
                {MdQuestionMark({size: 20, className: "text-gray-700"})}
                <span className='font-semibold'>About</span>
              </div>
              {isAboutOpen ? FaAngleUp({size: 16}) : FaAngleDown({size: 16})}
            </button>
            {isAboutOpen && (
              <div className='px-6 pb-4'>
                <p className='text-sm text-gray-600 leading-relaxed'>
                  {businessData.description || 'No description available'}
                </p>
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
                {FaRegClock({size: 20, className: "text-gray-700"})}
                <span className='font-semibold'>Business Hours</span>
              </div>
              {isHoursOpen ? FaAngleUp({size: 16}) : FaAngleDown({size: 16})}
            </button>
            {isHoursOpen && (
              <div className='px-6 pb-4'>
                <div className='space-y-2'>
                  {activeBusinessHours.map((item: any, index: number) => (
                    <div key={index} className='flex justify-between text-sm'>
                      <span className='text-gray-700'>{item.dayOfWeek.substring(0, 3)}</span>
                      <span className='text-gray-600'>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </span>
                    </div>
                  ))}
                  {activeBusinessHours.length === 0 && (
                    <p className='text-sm text-gray-500 italic'>No business hours set</p>
                  )}
                </div>
                <p className='text-xs text-gray-500 text-center mt-4 italic'>
                  Time zone ({businessData.timezone || 'Not set'})
                </p>
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
                {FaLocationDot({size: 20, className: "text-gray-700"})}
                <span className='font-semibold'>Location</span>
              </div>
              {isLocationOpen ? FaAngleUp({size: 16}) : FaAngleDown({size: 16})}
            </button>
            {isLocationOpen && (
              <div className='px-6 pb-4'>
                <p className='text-sm text-gray-600'>
                  {businessData.location || 'No location set'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <div className='hidden lg:flex bg-white flex-col items-center justify-center border rounded-3xl p-10 border-gray-200 font-poppins w-full'>
        <div className='flex items-center justify-center mb-3'>
          {businessData.logo ? (
            <img 
              src={businessData.logo}
              alt={businessData.businessName} 
              className='w-24 h-24 rounded-full object-cover' 
            />
          ) : (
            <div className='w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-bold'>
              {businessData.businessName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h3 className="text-gray-900 text-center font-semibold text-lg break-words">{businessData.businessName}</h3>

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
          {businessData.phone && (
            <a 
              href={`tel:${businessData.phone}`}
              className='flex flex-row mb-1 gap-2 items-center hover:text-emerald-600 transition cursor-pointer'
            >
              {BsFillTelephoneFill({className: 'text-sm'})}
              <p className='text-xs'>{businessData.phone}</p>
            </a>
          )}
          {businessData.email && (
            <a 
              href={`mailto:${businessData.email}`}
              className='flex flex-row mb-1 gap-2 items-center hover:text-emerald-600 transition cursor-pointer'
            >
              {MdEmail({className: 'text-sm'})}
              <p className='text-xs'>{businessData.email}</p>
            </a>
          )}
        </div>

        {businessData.tagline && (
          <p className='text-sm text-center mt-4 break-words w-full'>
            {businessData.tagline}
          </p>
        )}

        <button className='btn-primary mt-4' onClick={handleBookNow}>Book Now</button>

        {/* About Section */}
        <div className='mt-8 w-full pt-4'>
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {MdQuestionMark({className: "text-gray-900"})}
              <h4 className='text-gray-900 font-semibold text-base'>About</h4>
            </div>
            {isAboutOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>
          
          {isAboutOpen && (
            <p className='text-gray-600 text-sm mt-3 leading-relaxed'>
              {businessData.description || 'No description available'}
            </p>
          )}
        </div>

        {/* Business Hours Section */}
        <div className="mt-8 w-full pt-4">
          <button 
            onClick={() => setIsHoursOpen(!isHoursOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {FaRegClock({className: "text-gray-900"})}
              <h4 className='text-gray-900 font-semibold text-base'>Business Hours</h4>
            </div>
            {isHoursOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>

          {isHoursOpen && (
            <div className='mt-4'>
              <div className='space-y-2'>
                {activeBusinessHours.map((item: any, index: number) => (
                  <div key={index} className='flex justify-between text-sm'>
                    <span className='text-gray-700 font-medium'>{item.dayOfWeek.substring(0, 3)}</span>
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
                Time zone ({businessData.timezone || 'Not set'})
              </p>
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
              {FaLocationDot({className: "text-gray-900"})}
              <h4 className='text-gray-900 font-semibold text-base'>Location</h4>
            </div>
            {isLocationOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>
          
          {isLocationOpen && (
            <p className='text-gray-600 text-sm mt-3'>
              {businessData.location || 'No location set'}
            </p>
          )}
        </div>
      </div>
    </>
  )
}