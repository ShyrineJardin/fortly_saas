import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoCopyOutline, IoMenuOutline} from "react-icons/io5";
import { HiOutlineChat } from "react-icons/hi";
import { authAPI } from '../../utils/api';
import BusinessCalendar from './BusinessCalendar';

export default function BusinessHeader() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [showPendingBookingsModal, setShowPendingBookingsModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await authAPI.getMe();
      setBusinessData(response.data.business);
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  // Calculate trial days remaining based on account creation date
  const getTrialInfo = () => {
    if (!businessData?.createdAt) return { daysUsed: 0, daysLeft: 30, percent: 0 };
    const created = new Date(businessData.createdAt);
    const now = new Date();
    const daysUsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 30 - daysUsed);
    const percent = Math.min(100, (daysUsed / 30) * 100);
    return { daysUsed, daysLeft, percent };
  };

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent('openChat'));
  };

  const handleCopyLink = async () => {
    const fullUrl = `${window.location.origin}/${businessData?.slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenCalendar = () => {
    navigate('/business/calendar');
  };

  const handleUnlockPro = () => {
    setIsTrialModalOpen(true);
  };

  const handleDeleteAccount = async () => {
    try {
      await authAPI.deleteAccount();
      localStorage.removeItem('token');
      window.location.href = '/business/login';
    } catch (error: any) {
      console.error('Error deleting account:', error);

      // Check if error is due to pending bookings
      if (error.response?.status === 400 && error.response?.data?.pendingBookings) {
        setPendingBookings(error.response.data.pendingBookings);
        setShowPendingBookingsModal(true);
        setIsSettingsOpen(false); // Close settings modal
      } else {
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const handleFinalDelete = () => {
    setShowDeleteConfirmModal(false);
    handleDeleteAccount();
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/business/login';
  };

  if (!businessData) {
    return (
      <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </header>
    );
  }

  const { daysUsed, daysLeft, percent } = getTrialInfo();

  // Color based on urgency
  const urgencyColor = daysLeft > 14 ? '#6FCF97' : daysLeft > 7 ? '#F2994A' : '#EB5757';
  const urgencyBg = daysLeft > 14 ? 'bg-green-50' : daysLeft > 7 ? 'bg-orange-50' : 'bg-red-50';
  const urgencyText = daysLeft > 14 ? 'text-green-700' : daysLeft > 7 ? 'text-orange-700' : 'text-red-700';

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full">
        
        {/* --- MOBILE/TABLET VIEW --- */}
        <div className="flex lg:hidden flex-col items-center justify-between w-full">
            <div className='flex justify-between w-full'>
                <div className="flex items-center gap-3">
                    {businessData.logo ? (
                      <img 
                        src={businessData.logo}
                        alt={businessData.businessName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {businessData.businessName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">{businessData.businessName}</h3>
                      <div className="flex items-center gap-2">
                        <a 
                          href={`/${businessData.slug}`}  
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:opacity-80 transition-opacity"
                        >
                          <span className="text-xs text-gray-500">fortly.io/</span>
                          <span className="text-xs font-semibold text-hoverGreen">{businessData.slug}</span>
                        </a>
                        <button 
                          onClick={handleCopyLink}
                          className="text-gray-400 hover:text-gray-600 relative"
                        >
                          {IoCopyOutline({size: 12})}
                          {copySuccess && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Copied!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                      onClick={handleChatClick}
                      className="text-gray-700"
                    >
                      {HiOutlineChat({size: 28})}
                    </button>
                    <button 
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="text-gray-700"
                    >
                      {IoMenuOutline({size: 30})}
                    </button>
                </div>
            </div>

          <div className='flex items-center justify-center mt-5'>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 cursor-pointer">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Portfolio is live</span>
            </div>
          </div>
        </div>

        {/* --- DESKTOP VIEW --- */}
        <div className="hidden lg:block flex-col w-full items-center justify-between">
            <div className='flex justify-between mb-6'>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <a 
                        href={`/${businessData.slug}`}  
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:opacity-80 transition-opacity"
                      >
                        <span className="text-sm text-gray-500">fortly.io/</span>
                        <span className="text-sm font-bold text-hoverGreen">{businessData.slug}</span>
                      </a>
                      <button 
                        onClick={handleCopyLink}
                        className="text-gray-400 hover:text-gray-600 relative"
                      >
                        {IoCopyOutline({size: 16})}
                        {copySuccess && (
                          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            Copied!
                          </span>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">Click the link to preview your website</p>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                      onClick={handleOpenCalendar}
                      className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium"
                    >
                      Calendar
                    </button>
                    <button 
                      onClick={handleUnlockPro}
                      className="bg-green-50 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-opacity-80 transition-colors"
                    >
                      Unlock Pro
                    </button>
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      Settings
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      Sign out
                    </button>
                </div>
            </div>

           <div className='flex items-center justify-center'>
            <div className="cursor-pointer hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Portfolio is live</span>
            </div>
           </div>
        </div>
      </div>

      {/* Trial Countdown Modal */}
      {isTrialModalOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-50" 
            onClick={() => setIsTrialModalOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-2xl shadow-xl z-50 p-6 flex flex-col items-center text-center">
            
            <button 
              onClick={() => setIsTrialModalOpen(false)}
              className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 text-xl leading-none"
            >
              ×
            </button>

            {/* Ring */}
            <div className="relative w-24 h-24 mb-4">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="#f3f4f6" strokeWidth="7" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke={urgencyColor}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (percent / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-gray-900 leading-none">{daysLeft}</span>
                <span className="text-[11px] text-gray-400 mt-1">days left</span>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-800">Free trial · Day {daysUsed} of 30</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">
              {daysLeft > 0 ? `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Your trial has ended'}
            </p>

            <a
              href="https://fortly.vercel.app/#pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-primary"
            >
              View pricing
            </a>

          </div>
        </>
      )}

      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-16 right-4 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 lg:hidden animate-in fade-in zoom-in duration-200">
            <ul className="flex flex-col text-center">
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('openMobileProfile'));
                  }}
                  className="w-full text-center"
                >
                  View Profile
                </button>
              </li>              
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer border-b border-gray-50">
                <a href={`/${businessData.slug}`} target="_blank" rel="noopener noreferrer">Preview Website</a>
              </li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                  <button 
                    onClick={handleOpenCalendar}
                    className="w-full text-center"
                  >
                    Calendar
                  </button>
              </li>
              <li className="px-4 py-2">
                <button 
                  onClick={handleUnlockPro}
                  className="w-full bg-green-50 text-gray-900 py-2 rounded-full text-sm font-bold"
                >
                  Unlock Pro
                </button>
              </li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full text-center"
                >
                  Settings
                </button>
              </li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <button onClick={handleSignOut} className="w-full text-center">Sign out</button>
              </li>
            </ul>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Danger Zone */}
              <div className="border-2 border-red-200 rounded-xl p-5 bg-red-50">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete all your data including services, bookings, messages, and reviews. Please be certain.
                </p>
                <button 
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setShowDeleteConfirmModal(true);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirmModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-[60]" 
            onClick={() => setShowDeleteConfirmModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-1">Delete Account?</h2>
                  <p className="text-red-100 text-sm">This action cannot be undone</p>
                </div>
              </div>
            </div>
      
            {/* Body */}
            <div className="p-6">
              <p className="text-gray-700 mb-6 leading-relaxed">
                Are you sure you want to delete your account? This will permanently delete:
              </p>
      
              {/* What will be deleted */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-red-900">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong className="font-semibold">All your services</strong> and portfolio items</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-red-900">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong className="font-semibold">All bookings</strong> (past and completed)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-red-900">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong className="font-semibold">All messages</strong> and chat history</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-red-900">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong className="font-semibold">All reviews</strong> and ratings</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-red-900">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span><strong className="font-semibold">Your business profile</strong> and website</span>
                  </li>
                </ul>
              </div>
      
              {/* Warning Box */}
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-amber-900">
                    <strong className="font-semibold">Warning:</strong> This action is permanent and cannot be reversed. All data will be lost forever.
                  </p>
                </div>
              </div>
      
              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFinalDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/40"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Pending Bookings Warning Modal */}
      {showPendingBookingsModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            onClick={() => setShowPendingBookingsModal(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Cannot Delete Account
                  </h2>
                  <p className="text-gray-600">
                    You have <strong className="text-red-600">{pendingBookings.length} pending or confirmed appointment{pendingBookings.length > 1 ? 's' : ''}</strong>. 
                    Please complete or cancel all appointments before deleting your account.
                  </p>
                </div>
                <button 
                  onClick={() => setShowPendingBookingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
      
              {/* Pending Bookings List */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Pending Appointments</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pendingBookings.map((booking, index) => (
                    <div 
                      key={booking.id || index}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {booking.clientName}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {booking.serviceName}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(booking.bookingDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {booking.bookingTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                
              {/* Action Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  What you can do:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Complete the appointments after serving your clients</li>
                  <li>Cancel appointments if needed (clients will be notified)</li>
                  <li>Wait for all appointments to be completed or cancelled</li>
                </ul>
              </div>
                
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowPendingBookingsModal(false);
                    navigate('/business/calendar');
                  }}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Go to Calendar
                </button>
                <button
                  onClick={() => setShowPendingBookingsModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}