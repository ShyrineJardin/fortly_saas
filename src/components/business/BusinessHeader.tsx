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
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState(false);

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
    setIsComingSoonOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your data including services, bookings, and messages.')) {
      try {
        await authAPI.deleteAccount();
        localStorage.removeItem('token');
        window.location.href = '/business/login';
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
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

      {/* Coming Soon Modal */}
      {isComingSoonOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            onClick={() => setIsComingSoonOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-md bg-white rounded-2xl shadow-2xl z-50 p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-softGreen rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-hoverGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Coming Soon!</h2>
              <p className="text-gray-600">
                We're working hard to bring you Pro features. Stay tuned for updates!
              </p>
            </div>
            <button 
              onClick={() => setIsComingSoonOpen(false)}
              className="w-full btn-primary"
            >
              Got it
            </button>
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
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}