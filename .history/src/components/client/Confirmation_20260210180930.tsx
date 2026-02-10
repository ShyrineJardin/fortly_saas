import React, { useState, useEffect } from "react";
import { useLocation, Navigate, useParams } from "react-router-dom";
import { FaFacebook, FaXTwitter, FaInstagram, FaLinkedin, FaCalendar, FaCheck } from 'react-icons/fa6'
import { BsFillTelephoneFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import ServiceCard from "../shared/ServiceCard";
import Footer from "../client/Footer";
import { businessAPI, clientCalendarAPI, bookingsAPI } from '../../utils/api';

export default function Confirmation() {
    const location = useLocation();
    const { businessSlug } = useParams<{ businessSlug: string }>();
    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    
    // Calendar sync states
    const [calendarConnected, setCalendarConnected] = useState(false);
    const [showCalendarOption, setShowCalendarOption] = useState(false);
    const [connectingCalendar, setConnectingCalendar] = useState(false);
    
    // Cancellation modal states
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    
    // Catch the service data passed from the Booking page
    const selectedService = location.state?.selectedService;
    const bookingDate = location.state?.bookingDate;
    const bookingTime = location.state?.bookingTime;
    const customerInfo = location.state?.customerInfo;
    const bookingData = location.state?.booking;
    const bookingDetails = location.state?.bookingDetails;
    
    // Get calendar sync status from booking response
    const calendarSync = location.state?.calendarSync;
    const hasChatHistory = location.state?.hasChatHistory;
    const chatMessageCount = location.state?.chatMessageCount;

    useEffect(() => {
        fetchBusinessData();
    }, [businessSlug]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('calendar') === 'connected') {
            setCalendarConnected(true);
            setShowCalendarOption(false);
        }

        if (calendarSync?.requiresClientAuth && calendarSync?.clientAuthUrl) {
            setShowCalendarOption(true);
        }

        if (bookingData?.clientEmail) {
            checkCalendarStatus();
        }
    }, [calendarSync, bookingData]);

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

    const checkCalendarStatus = async () => {
        try {
            const response = await clientCalendarAPI.checkStatus(bookingData.clientEmail);
            if (response.data.connected) {
                setCalendarConnected(true);
                setShowCalendarOption(false);
            }
        } catch (error) {
            console.error('Error checking calendar status:', error);
        }
    };

    const handleConnectCalendar = async () => {
        try {
            setConnectingCalendar(true);
            
            if (calendarSync?.clientAuthUrl) {
                window.location.href = calendarSync.clientAuthUrl;
                return;
            }

            const response = await clientCalendarAPI.getAuthUrl(
                bookingData.clientEmail,
                bookingData.id
            );

            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Error getting auth URL:', error);
            alert('Failed to connect calendar. Please try again.');
            setConnectingCalendar(false);
        }
    };

    // Handle cancellation with reason
    const handleCancelBooking = async () => {
        if (!cancelReason.trim()) {
            alert('Please provide a reason for cancellation');
            return;
        }

        try {
            setCancelling(true);

            await bookingsAPI.cancel(bookingData.id, {
                clientEmail: bookingData.clientEmail,
                reason: cancelReason,
                cancelledBy: 'client'
            });

            alert('✅ Booking cancelled successfully. Both you and the business have been notified.');
            
            // Redirect to services page
            window.location.href = `/${businessSlug}/services`;

        } catch (error: any) {
            console.error('Error cancelling booking:', error);
            alert(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

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
            return dateString;
        }
    };

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
            return timeString;
        }
    };

    const calculateEndTime = (startTime: string | undefined, duration: string | undefined) => {
        if (!startTime || !duration) return '';
        
        try {
            const timeParts = startTime.split(':');
            if (timeParts.length < 2) return '';
            
            const hours = parseInt(timeParts[0], 10);
            const minutes = parseInt(timeParts[1], 10);
            if (isNaN(hours) || isNaN(minutes)) return '';
            
            let totalMinutes = hours * 60 + minutes;
            
            const durationMatch = duration.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
            if (!durationMatch) return '';

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
                    return '';
                default:
                    durationMinutes = 60;
            }

            if (durationMinutes >= 1440) return '';

            totalMinutes += durationMinutes;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;

            const ampm = endHours >= 12 ? 'PM' : 'AM';
            const displayHour = endHours > 12 ? endHours - 12 : endHours === 0 ? 12 : endHours;

            return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
        } catch (error) {
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

    const activeSocialMedia = businessData ? [
        { name: 'facebook', url: businessData.facebook, Icon: FaFacebook },
        { name: 'twitter', url: businessData.twitter, Icon: FaXTwitter },
        { name: 'instagram', url: businessData.instagram, Icon: FaInstagram },
        { name: 'linkedin', url: businessData.linkedin, Icon: FaLinkedin }
    ].filter(social => social.url && social.url.trim() !== '') : [];

    const handleBookAnother = () => {
        window.location.href = `/${businessSlug}/services`;
    };

    const finalDate = bookingDate || bookingDetails?.date || bookingData?.bookingDate;
    const finalTime = bookingTime || bookingDetails?.time || bookingData?.bookingTime;
    
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
        rawTime = convertTo24Hour(finalTime);
    }
    const formattedEndTime = calculateEndTime(rawTime, selectedService?.duration);

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

                    {hasChatHistory && chatMessageCount > 0 && (
                        <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm text-purple-800">
                                💬 <strong>{chatMessageCount} message{chatMessageCount !== 1 ? 's' : ''}</strong> from your conversation 
                            </p>
                        </div>
                    )}

                    <div className="mt-6">
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

                    <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-sm mb-3">What happens next?</h3>
                        <ul className="space-y-2 text-xs text-gray-700">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>You'll receive a confirmation email with all booking details</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">✓</span>
                                <span>You can cancel anytime by clicking the button below or by visiting the site</span>
                            </li>
                            {hasChatHistory && (
                                <li className="flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>Your conversation history is saved and referenced in the appointment</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleBookAnother}
                            className="btn-primary w-full px-8"
                        >
                            Book another appointment
                        </button>
                    </div>

                    {/* Simple cancel button */}
                    {bookingData?.id && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="btn-secondary text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700 w-full px-8"
                            >
                                ❌ Cancel Appointment
                            </button>
                        </div>
                    )}

                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-600">
                            Need to make changes?{' '}
                            <a 
                                href={`mailto:${businessData?.email || ''}`}
                                className="text-primaryGreen hover:underline font-medium"
                            >
                                Contact us
                            </a>
                        </p>
                    </div>
                </div>
            </main>

            {/* Cancel Modal */}
            {showCancelModal && (
                <>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
                        onClick={() => !cancelling && setShowCancelModal(false)}
                    />
                    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Cancel Appointment</h3>
                            {!cancelling && (
                                <button 
                                    onClick={() => setShowCancelModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    {IoClose({ size: 24 })}
                                </button>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4">
                            Please let us know why you're cancelling this appointment. Both you and {businessData?.businessName} will be notified.
                        </p>

                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="e.g., Schedule conflict, emergency, need to reschedule..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm mb-4"
                            disabled={cancelling}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={cancelling}
                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={cancelling || !cancelReason.trim()}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {cancelling ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Appointment'
                                )}
                            </button>
                        </div>
                    </div>
                </>
            )}
            
        </div>
    );
}