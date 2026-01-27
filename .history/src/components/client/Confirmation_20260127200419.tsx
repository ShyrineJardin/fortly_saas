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

    // Format date to readable format: "Saturday, December 14, 2024"
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date not set';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format time to 12-hour format: "10:30 AM"
    const formatTime = (timeString: string) => {
        if (!timeString) return 'Time not set';
        
        // Parse time string (format: "HH:MM:SS" or "HH:MM")
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // Convert to 12-hour format
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        
        return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    };

    // Calculate end time based on service duration
    const calculateEndTime = (startTime: string, duration: string) => {
        if (!startTime || !duration) return '';
        
        // Parse start time
        const [hours, minutes] = startTime.split(':').map(Number);
        let totalMinutes = hours * 60 + minutes;
        
        // Parse duration
        const durationMatch = duration.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
        if (!durationMatch) return '';
        
        const value = parseFloat(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        
        // Convert duration to minutes
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
                // For multi-day services, just show the start time
                return '';
            default:
                durationMinutes = 60;
        }
        
        // Calculate end time
        totalMinutes += durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        
        // Format end time
        const ampm = endHours >= 12 ? 'PM' : 'AM';
        const displayHour = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;
        
        return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
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

    // Format the date and times
    const formattedDate = formatDate(bookingDate);
    const formattedStartTime = formatTime(bookingTime);
    const formattedEndTime = calculateEndTime(bookingTime, selectedService?.duration);

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
                            {formattedStartTime && (
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