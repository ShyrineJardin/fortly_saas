import React, { useState } from 'react'
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaLocationDot, FaAngleUp, FaAngleDown, FaRegClock } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import {  MdQuestionMark, MdEmail } from "react-icons/md";

export default function ClientSidebar() {
  // State for toggling sections
  const [isAboutOpen, setIsAboutOpen] = useState(true);
  const [isHoursOpen, setIsHoursOpen] = useState(true);
  const [isLocationOpen, setIsLocationOpen] = useState(true);

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
    <div className='bg-white flex flex-col items-center justify-center border rounded-3xl p-10 border-border font-poppins w-full'>

      {/* Logo & Business Name Section (Static) */}
      <div className='flex items-center justify-center mb-3'>
        <div className='w-24 h-24 rounded-full bg-gray-300'> </div>
      </div>

      <h3 className="text-textPrimary text-center font-semibold text-lg break-words">Business Name</h3>

      {/* Social Media Icons */}
      <div className='flex gap-4 mt-2 mb-2'>
        <a href="#" className='text-base'>{FaFacebook({})}</a>
        <a href="#" className='text-base'>{FaXTwitter({})}</a>
        <a href="#" className='text-base'>{FaInstagram({})}</a>
        <a href="#" className='text-base'>{FaLinkedin({})}</a>
      </div>

      {/* Contact Info */}
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

      {/* --- COLLAPSIBLE ABOUT --- */}
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

      {/* --- COLLAPSIBLE BUSINESS HOURS --- */}
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

      {/* --- COLLAPSIBLE LOCATION --- */}
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
  )
}