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
    const bookingDetails = location.state?.bookingDetails;

    // Fetch business data from API (same as ClientSidebar)
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

    const formatDate = (dateString: string | undefined) => {
        console.log('🔄 Formatting date:', dateString);
        
        if (!dateString) {
            console.warn('⚠️ No date string provided');
            return 'Date not set';
        }
        
        try {
            const date = new Date(dateString);
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.error('❌ Invalid date:', dateString);
                return dateString; 
            }
            
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return dateString;
        }
    };

    const formatTime = (timeString: string | undefined) => {
        console.log('🔄 Formatting time:', timeString);
        
        if (!timeString) {
            console.warn('⚠️ No time string provided');
            return 'Time not set';
        }
        
        try {
            const timeParts = timeString.split(':');
            if (timeParts.length < 2) {
                console.error('❌ Invalid time format:', timeString);
                return timeString;
            }
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes)) {
                console.error('❌ Invalid time values:', timeString);
                return timeString;
            }
            
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
            
            return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
        } catch (error) {
            console.error('❌ Error formatting time:', error);
            return timeString;
        }
    };

    const calculateEndTime = (startTime: string | undefined, duration: string | undefined) => {
        if (!startTime || !duration) {
            console.warn('⚠️ Missing startTime or duration');
            return '';
        }
        
             try {
            const timeParts = startTime.split(':');
            if (timeParts.length < 2) return '';
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            
            if (isNaN(hours) || isNaN(minutes)) return '';
            
            let totalMinutes = hours * 60 + minutes;
            
            const durationMatch = duration.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
            if (!durationMatch) {
                console.warn('⚠️ Could not parse duration:', duration);
                return '';
            }

            const value = parseFloat(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();

            let durationMinutes = 0;
            switch (unit) {
                case 'minute':
                case 'minutes':
                case 'min':
                case 'mins':
                    durationMinutes = value;
                    break;
                case 'hour':
                case 'hours':
                case 'hr':
                case 'hrs':
                    durationMinutes = value * 60;
                    break;
                case 'day':
                case 'days':
                    console.log('📅 Multi-day service detected');
                    return '';
                default:
                    durationMinutes = 60;
            }

            if (durationMinutes >= 1440) { // 1440 minutes = 24 hours
                console.log('📅 Duration is 24+ hours, not showing end time');
                return '';
            }

            // Calculate end time
            totalMinutes += durationMinutes;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;

            // Format end time
            const ampm = endHours >= 12 ? 'PM' : 'AM';
            const displayHour = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;

            return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
        } catch (error) {
            console.error('❌ Error calculating end time:', error);
            return '';
        }
    };

    if (!selectedService) {
        console.error('❌ No selected service found, redirecting...');
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

    // Prepare active social media links (same logic as ClientSidebar)
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
    const finalDate = bookingDate || bookingDetails?.date || bookingData?.bookingDate;
    const finalTime = bookingTime || bookingDetails?.time || bookingData?.bookingTime;
    
    console.log('✅ Final Date:', finalDate);
    console.log('✅ Final Time:', finalTime);

    // Convert 12-hour time to 24-hour format for calculations
    const convertTo24Hour = (time12h: string) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier === 'PM') {
            hours = String(parseInt(hours, 10) + 12);
        }

        return `${hours.padStart(2, '0')}:${minutes}:00`;
    };


    const isDateAlreadyFormatted = finalDate?.includes(',');
    const formattedDate = isDateAlreadyFormatted ? finalDate : formatDate(finalDate);

    const isTimeAlreadyFormatted = finalTime?.includes('AM') || finalTime?.includes('PM');
    const formattedStartTime = isTimeAlreadyFormatted ? finalTime : formatTime(finalTime);

    let rawTime = finalTime;
    if (isTimeAlreadyFormatted) {
        // Convert "9:17 AM" back to "09:17:00" for calculation
        rawTime = convertTo24Hour(finalTime);
    }
    const formattedEndTime = calculateEndTime(rawTime, selectedService?.duration);


    console.log('📊 Display values:', {
        formattedDate,
        formattedStartTime,
        formattedEndTime
    });

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
            
        </div>
    );
}