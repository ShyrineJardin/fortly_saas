import React, { useState } from "react";
import { useLocation, Navigate } from "react-router-dom"; // Added Navigate for safety
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaAngleUp, FaAngleDown } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import ServiceCard from "../shared/ServiceCard";


export default function Confirmation() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    
    // Catch the service data passed from the Booking page
    const selectedService = location.state?.selectedService;

    // Safety: If no service is found (e.g. page refresh), redirect to gallery
    if (!selectedService) {
        return <Navigate to="/gallery" replace />;
    }

    const handleBookAnother = () => {
        window.location.href = "/gallery";
    };

    return (
        <div className="flex flex-col max-w-2xl mx-auto p-6">
            <div className='flex flex-col items-center justify-center '>
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
                <p className="text-gray-500 lg:text-sm text-xs mb-1">Date & Time</p>
                <h3 className="text-textPrimary font-medium lg:text-base text-sm">
                    <span>Sat 14 December 2023</span> | <span>10:30 AM to 10:45 AM</span>
                </h3>
            </div>

            <div className="mt-6">
                <p className="text-gray-500 lg:text-sm text-xs mb-1">Location</p>
                <h3 className="text-textPrimary font-medium lg:text-base text-sm">
                    Lorem ipsum dolor sit amet. 33 omnis placeat sit corrupti excepturi et illum eveniet ea t
                </h3>
            </div>

            <div className="mt-6">
                <p className="text-gray-500 lg:text-sm text-xs mb-2">Service</p>
                
                {/* Use the shared ServiceCard with the PASSED data */}
                <ServiceCard 
                  id={selectedService.id}
                  title={selectedService.title}
                  duration={selectedService.duration}
                  price={selectedService.price}
                  description={selectedService.description}
                  showArrow={false} // Hide arrow because we are already here
                />
            </div>

            <div className="mt-6">
                <p className="text-gray-600 lg:text-sm text-xs leading-relaxed text-center">
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