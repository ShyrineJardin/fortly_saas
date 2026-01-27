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
                            <span>{bookingDate || 'Sat 14 December 2023'}</span> | <span>{bookingTime || '10:30 AM to 10:45 AM'}</span>
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
            </main>
        </div>
    );
}