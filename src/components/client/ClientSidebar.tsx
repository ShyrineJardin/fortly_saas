import React, { useState } from 'react'
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaLocationDot, FaAngleUp, FaAngleDown, FaRegClock, FaChevronRight } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdQuestionMark, MdEmail } from "react-icons/md";
import { HiOutlineChat } from "react-icons/hi";

export default function ClientSidebar() {
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isHoursOpen, setIsHoursOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(true);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const hours = [
    { day: "Sun", time: "10 AM – 6 PM" },
    { day: "Mon", time: "10 AM – 6 PM" },
    { day: "Tues", time: "10 AM – 6 PM" },
    { day: "Wed", time: "10 AM – 6 PM" },
    { day: "Thurs", time: "10 AM – 6 PM" },
    { day: "Fri", time: "10 AM – 6 PM" },
    { day: "Sat", time: "10 AM – 6 PM" },
  ];

  return (
    <>
      {/* MOBILE HEADER - Only visible on mobile */}
      <div className='lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40'>
        <div className='flex items-center justify-between'>
          <button 
            onClick={() => setShowMobileInfo(true)}
            className='flex items-center gap-3'
          >
            <div className='w-10 h-10 rounded-full bg-gray-300' />
            <h3 className="font-semibold md:text-base text-sm">Business Name</h3>
            {FaChevronRight({size: 16, className: "text-gray-600"})}
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openChat'))} 
            className='p-2'
          >
            {HiOutlineChat({size: 28})}
          </button>
        </div>
      </div>

      {/* MOBILE FULL-SCREEN INFO - Slides in from right */}
      {showMobileInfo && (
        <div className='lg:hidden fixed inset-0 bg-white z-50 overflow-y-auto'>
          {/* Mobile Info Header */}
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

          {/* Mobile Business Profile */}
          <div className='bg-white px-6 py-8 text-center'>
            <div className='flex justify-center mb-4'>
              <div className='w-20 h-20 rounded-full bg-gray-300' />
            </div>
            <h1 className='md:text-lg text-base font-semibold mb-2'>Business Name</h1>
            
            {/* Social Media Icons */}
            <div className='flex justify-center gap-4 mb-4'>
              <a href="#" className='text-gray-700'>{FaFacebook({size: '1rem'})}</a>
              <a href="#" className='text-gray-700'>{FaXTwitter({size: '1rem'})}</a>
              <a href="#" className='text-gray-700'>{FaInstagram({size: '1rem'})}</a>
              <a href="#" className='text-gray-700'>{FaLinkedin({size: '1rem'})}</a>
            </div>

            {/* Contact Info */}
            <div className='flex flex-col items-center gap-2 text-xs text-gray-600 mb-4'>
              <div className='flex items-center gap-2'>
                {BsFillTelephoneFill({size: 12})}
                <span>(123) 456-7890</span>
              </div>
              <div className='flex items-center gap-2'>
                {MdEmail({size: 12})}
                <span>test@gmail.com</span>
              </div>
            </div>

            <button className='btn-primary max-w-xs'>
              <a href="/services">Book Now</a>
            </button>
          </div>

          {/* Tagline */}
          <div className='bg-white px-6 py-4'>
            <p className='text-sm text-gray-600 text-center'>
              Tagline or short description of the business goes here.
            </p>
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
                  Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore voluptates aut ipsam voluptatem.
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
                  {hours.map((item, index) => (
                    <div key={index} className='flex justify-between text-sm'>
                      <span className='text-gray-700'>{item.day}</span>
                      <span className='text-gray-600'>{item.time}</span>
                    </div>
                  ))}
                </div>
                <p className='text-xs text-gray-500 text-center mt-4 italic'>
                  Time zone (Philippine Standard Time)
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
                  Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum evenie.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR - Only visible on desktop */}
      <div className='hidden lg:flex bg-white flex-col items-center justify-center border rounded-3xl p-10 border-border font-poppins w-full'>
        <div className='flex items-center justify-center mb-3'>
          <div className='w-24 h-24 rounded-full bg-gray-300' />
        </div>

        <h3 className="text-textPrimary text-center font-semibold text-lg break-words">Business Name</h3> 

        <div className='flex gap-4 mt-2 mb-2'>
          <a href="#" className='text-base'>{FaFacebook({})}</a>
          <a href="#" className='text-base'>{FaXTwitter({})}</a>
          <a href="#" className='text-base'>{FaInstagram({})}</a>
          <a href="#" className='text-base'>{FaLinkedin({})}</a>
        </div>

        <div className='mt-2 flex flex-col items-center justify-center text-textSecondary'>
          <div className='flex flex-row mb-1 gap-2 items-center'>
            {BsFillTelephoneFill({className: 'text-sm'})}
            <p className='text-xs'>(123) 456-7890</p>
          </div>
          <div className='flex flex-row mb-1 gap-2 items-center'>
            {MdEmail({className: 'text-sm'})}
            <p className='text-xs'>test@gmail.com</p>
          </div>
        </div>

        <p className='text-sm text-center mt-4 break-words w-full'>
          Tagline or short description of the business goes here.
        </p>

        <button className='btn-primary mt-4'><a href="/services">Book Now</a></button>

        <div className='mt-8 w-full pt-4'>
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {MdQuestionMark({className: "text-textPrimary"})}
              <h4 className='text-textPrimary font-semibold text-base'>About</h4>
            </div>
            {isAboutOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>
          
          {isAboutOpen && (
            <p className='text-textSecondary text-sm mt-3 leading-relaxed'>
              Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea inventore voluptates aut ipsam voluptatem.
            </p>
          )}
        </div>

        <div className="mt-8 w-full pt-4">
          <button 
            onClick={() => setIsHoursOpen(!isHoursOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {FaRegClock({className: "text-textPrimary"})}
              <h4 className='text-textPrimary font-semibold text-base'>Business Hours</h4>
            </div>
            {isHoursOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>

          {isHoursOpen && (
            <div className='mt-4'>
              <div className='space-y-2'>
                {hours.map((item, index) => (
                  <div key={index} className='flex justify-between text-sm'>
                    <span className='text-textSecondary font-medium'>{item.day}</span>
                    <span className='text-textSecondary'>{item.time}</span>
                  </div>
                ))}
              </div>
              <p className='text-xs text-textSecondary text-center mt-6 italic opacity-70'>
                Time zone (Philippine Standard Time)
              </p>
            </div>
          )}
        </div>

        <div className='mt-8 w-full pt-4'>
          <button 
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className='flex items-center justify-between w-full cursor-pointer hover:opacity-70 transition-all'
          >
            <div className='flex items-center gap-2'>
              {FaLocationDot({className: "text-textPrimary"})}
              <h4 className='text-textPrimary font-semibold text-base'>Location</h4>
            </div>
            {isLocationOpen ? FaAngleUp({}) : FaAngleDown({})}
          </button>
          
          {isLocationOpen && (
            <p className='text-textSecondary text-sm mt-3'>
              Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum evenie.
            </p>
          )}
        </div>
      </div>
    </>
  )
}