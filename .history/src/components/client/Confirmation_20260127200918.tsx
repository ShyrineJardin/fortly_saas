import React, { useState, useEffect } from "react";
import { useLocation, Navigate, useParams } from "react-router-dom";
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import ServiceCard from "../shared/ServiceCard";
import Footer from "../client/Footer";
import { businessAPI } from '../../utils/api';

export default function Confirmation() {
    const location = useLocation();
    const { businessSlug } = useParams<{ businessSlug: string }>();
    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Catch the service data passed from the Booking page
    const selectedService = location.state?.selectedService;
    const bookingDate = location.state?.bookingDate;
    const bookingTime = location.state?.bookingTime;
    const customerInfo = location.state?.customerInfo;
    const bookingData = location.state?.booking;

    // Fetch business data from API
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

    // Format date to readable format: "Saturday, December 14, 2024"
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'Date not set';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    };

    // Format time to 12-hour format: "10:30 AM"
    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return 'Time not set';
        
        try {
            const timeParts = timeString.split(':');
            if (timeParts.length < 2) return timeString;
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes)) return timeString;
            
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            
            return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            return timeString;
        }
    };

    // Parse duration string to minutes - handles multiple formats
    const parseDurationToMinutes = (durationStr: string | undefined): number => {
        if (!durationStr) return 0;

        // Handle if it's just a number (assume minutes)
        if (/^\d+$/.test(durationStr.trim())) {
            return parseInt(durationStr, 10);
        }

        // Match pattern: "number unit" like "60 minutes", "1.5 hours", "2 days"
        const match = durationStr.match(/^(\d+(?:\.\d+)?)\s*(\w+)?$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = (match[2] || 'minutes').toLowerCase();

        switch (unit) {
            case 'minute':
            case 'minutes':
            case 'min':
            case 'mins':
            case 'm':
                return value;
            case 'hour':
            case 'hours':
            case 'hr':
            case 'hrs':
            case 'h':
                return value * 60;
            case 'day':
            case 'days':
            case 'd':
                return value * 24 * 60;
            case 'week':
            case 'weeks':
            case 'w':
                return value * 7 * 24 * 60;
            default:
                // If no unit or unknown unit, assume minutes
                return value;
        }
    };

    // Calculate end time based on service duration
    const calculateEndTime = (startTime: string | undefined, duration: string | undefined) => {
        if (!startTime || !duration) return '';
        
        try {
            // Parse start time
            const timeParts = startTime.split(':');
            if (timeParts.length < 2) return '';
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes)) return '';
            
            let totalMinutes = hours * 60 + minutes;
            
            // Parse duration
            const durationMinutes = parseDurationToMinutes(duration);
            
            // If duration is 0 or couldn't be parsed, don't show end time
            if (durationMinutes === 0) return '';
            
            // For multi-day services (1440+ minutes = 1+ days), don't show end time
            if (durationMinutes >= 1440) return '';
            
            // Calculate end time
            totalMinutes += durationMinutes;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            
            // Format end time
            const ampm = endHours >= 12 ? 'PM' : 'AM';
            const displayHour = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
            
            return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
        } catch (error) {
            console.error('Error calculating end time:', error);
            return '';
        }
    };

    if (!selectedService) {
        return <Navigate to={`/${businessSlug}/services`} replace />;
    }

    if (loading) {
        return (
            <div className='flex flex-col min-h-screen'>
                <main className='flex-1 p-6 overflow-y-auto'>
                    <div className="flex items-center justify-center min-h-screen">
                        <p className="text-gray-500">Loading...</p>
                    </div>
                </main>
                <footer className='bg-footerBackground mt-auto'>
                    <Footer />
                </footer>
            </div>
        );
    }

    // Prepare active social media links
    const activeSocialMedia = businessData ? [
        { name: 'facebook', url: businessData.facebook, Icon: FaFacebook },
        { name: 'twitter', url: businessData.twitter, Icon: FaXTwitter },
        { name: 'instagram', url: businessData.instagram, Icon: FaInstagram },
        { name: 'linkedin', url: businessData.linkedin, Icon: FaLinkedin }
    ].filter(social => social.url && social.url.trim() !== '') : [];

    const handleBookAnother = () => {
        window.location.href = `/${businessSlug}/services`;
    };

    // Try to get date/time from different possible sources
    const finalDate = bookingDate || bookingData?.bookingDate;
    const finalTime = bookingTime || bookingData?.bookingTime;

    // Format the date and times
    const formattedDate = formatDate(finalDate);
    const formattedStartTime = formatTime(finalTime);
    const formattedEndTime = calculateEndTime(finalTime, selectedService?.duration);

    return (
        <div className='flex flex-col min-h-screen'>
            <main className='flex-1 p-6 overflow-y-auto'>
                <div className="flex flex-col max-w-2xl mx-auto">
                    <div className='flex flex-col items-center justify-center '>
                        <div className='flex items-center justify-center mb-3'>
                            {businessData?.logo ? (
                                <img 
                                    src={`http://localhost:5000${businessData.logo}`} 
                                    alt={businessData.businessName} 
                                    className='w-20 h-20 rounded-full object-cover' 
                                />
                            ) : (
                                <div className='w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600'>
                                    {businessData?.businessName?.charAt(0).toUpperCase() || 'B'}
                                </div>
                            )}
                        </div>
                        <h2 className="text-hoverGreen text-center font-semibold text-xl">Booking Confirmed</h2>
                        <h3 className="text-textPrimary text-center text-base break-words">with <span className="font-semibold">{businessData?.businessName || 'Business Name'}</span></h3>

                        {/* Social Media Icons */}
                        {activeSocialMedia.length > 0 && (
                            <div className='flex gap-4 mt-2 mb-2'>
                                {activeSocialMedia.map(({ name, url, Icon }) => (
                                    <a 
                                        key={name} 
                                        href={url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className='text-base'
                                    >
                                        {Icon({})}
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className='mt-2 flex flex-col items-center justify-center text-textSecondary'>
                            {businessData?.phone && (
                                <a 
                                      href={`tel:${businessData.phone}`}
                                      className='flex items-center mb-1 gap-2 hover:text-emerald-600 transition'
                                    >
                                      {BsFillTelephoneFill({size: 12})}
                                      <span className="text-xs">{businessData.phone}</span>
                                </a>
                            )}
                            {businessData?.email && (
                               <a 
                                     href={`mailto:${businessData.email}`}
                                     className='flex items-center gap-2 hover:text-emerald-600 transition'
                                   >
                                     {MdEmail({size: 12})}
                                     <span className="text-xs">{businessData.email}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="text-gray-500 lg:text-sm text-xs mb-1">Date & Time</p>
                        <h3 className="text-textPrimary font-medium lg:text-base text-sm">
                            <span>{formattedDate}</span>
                            {formattedStartTime && formattedStartTime !== 'Time not set' && (
                                <>
                                    {' | '}
                                    <span>{formattedStartTime}</span>
                                    {formattedEndTime && (
                                        <span> to {formattedEndTime}</span>
                                    )}
                                </>
                            )}
                        </h3>
                    </div>

                    <div className="mt-6">
                        <p className="text-gray-500 lg:text-sm text-xs mb-1">Location</p>
                        <h3 className="text-textPrimary font-medium lg:text-base text-sm">
                            {businessData?.location || 'No location set'}
                        </h3>
                    </div>

                    <div className="mt-6">
                        <p className="text-gray-500 lg:text-sm text-xs mb-2">Service</p>
                        
                        <ServiceCard 
                            id={selectedService.id}
                            title={selectedService.title}
                            duration={selectedService.duration}
                            price={selectedService.price}
                            description={selectedService.description}
                            image={selectedService.image}
                            showArrow={false}
                        />
                    </div>

                    {customerInfo?.notes && (
                        <div className="mt-6">
                            <p className="text-gray-500 lg:text-sm text-xs mb-1">Additional Notes</p>
                            <p className="text-textPrimary lg:text-sm text-xs">
                                {customerInfo.notes}
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
                        <p className="text-gray-600 lg:text-sm text-xs leading-relaxed text-center">
                            You're all set! Your appointment has been confirmed. You should receive a confirmation email and calendar invite shortly.
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
            </main>
            <footer className='bg-footerBackground mt-auto'>
                <Footer />
            </footer>
        </div>
    );
}