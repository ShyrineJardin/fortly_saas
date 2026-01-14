import React, { useState } from "react";
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaAngleUp, FaAngleDown } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";

export default function Confirmation() {
    const [isOpen, setIsOpen] = useState(false);

    const handleBookAnother = () => {
        window.location.href = "/gallery";
    };

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-6">
            <div className='flex flex-col items-center justify-center '>
                {/* Logo & Business Name Section (Static) */}
                <div className='flex items-center justify-center mb-3'>
                    <div className='w-24 h-24 rounded-full bg-gray-300'> </div>
                </div>
                <h2 className="text-textPrimary text-center font-semibold text-xl">Booking Confirmed</h2>
                <h3 className="text-textPrimary text-center text-base break-words">with <span className="font-semibold">Business Name</span></h3>

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
            </div>

            <div className="mt-8">
                <p className="text-gray-500 text-sm mb-1">Date & Time</p>
                <h3 className="text-textPrimary font-medium text-base">
                    <span>Sat 14 December 2023</span> | <span>10:30 AM to 10:45 AM</span>
                </h3>
            </div>

            <div className="mt-6">
                <p className="text-gray-500 text-sm mb-1">Location</p>
                <h3 className="text-textPrimary font-medium text-base">
                    Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea t
                </h3>
            </div>

            <div className="mt-6">
                <p className="text-gray-500 text-sm mb-2">Service</p>
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
            </div>

            <div className="mt-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                    You're all set! Your appointment has been added to your calendar. If it didn't appear, add it manually and make sure notifications are turned on.
                </p>
            </div>

            <div className="mt-10 flex justify-center">
                <button
                    onClick={handleBookAnother}
                    className="btn-primary w-full md:w-auto px-8"
                >
                    Book another appointment
                </button>
            </div>
        </div>
    );
}