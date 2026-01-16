import React, { useState } from 'react';
import { IoCopyOutline, IoMenuOutline} from "react-icons/io5";
import { HiOutlineChat } from "react-icons/hi";

export default function BusinessHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent('openChat'));
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Handle account deletion
      console.log('Account deletion requested');
    }
  };

  const handleSignOut = () => {
    // Clear any stored tokens or session data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/business/login';
  };

  return (
    <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full">
        
        {/* --- MOBILE/TABLET VIEW (Matches image_790a52.png) --- */}
        <div className="flex lg:hidden flex-col items-center justify-between w-full">
            <div className='flex justify-between w-full'>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200" /> {/* Profile Placeholder */}
                    <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-gray-900 leading-tight">Business Name</h3>
                    <div className="flex items-center gap-2">
                    <a href="/"  target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                        <span className="text-xs text-gray-500">fortly.io/</span>
                        <span className="text-xs font-semibold text-gray-900">businessname</span>
                    </a>
                    <button className="text-gray-400 hover:text-gray-600">
                        {IoCopyOutline ({size: 12})}
                    </button>
                    </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                      onClick={handleChatClick}
                      className="text-gray-700"
                    >
                      {HiOutlineChat ({size: 28})}
                    </button>
                    <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="text-gray-700"
                    >
                    {IoMenuOutline ({size: 30})}
                    </button>
                </div>
            </div>
          

          <div className='flex items-center justify-center mt-5'>
            {/* Center: Live Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Portfolio is live</span>
            </div>
            </div>
        </div>

        {/* --- DESKTOP VIEW (Original Layout) --- */}
        <div className="hidden lg:block flex-col w-full items-center justify-between">
            <div className='flex justify-between mb-6'>
                {/* Left: Link & Status */}
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                    <a href="/"  target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                        <span className="text-sm text-gray-500">fortly.io/</span>
                        <span className="text-sm font-bold text-gray-900">businessname</span>
                    </a>
                    <button className="text-gray-400 hover:text-gray-600">
                        {IoCopyOutline ({size: 16})}
                    </button>
                    </div>
                    <p className="text-[11px] text-gray-400">Click the link to preview your website</p>
                </div>

                {/* Right: Navigation Actions */}
                <div className="flex items-center gap-6">
                    <a href='/' className="text-sm text-gray-600 hover:text-green-600 transition-colors font-medium">
                    Open Bookings
                    </a>
                    <a href='/' className="bg-green-50 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-opacity-80 transition-colors">
                    Unlock Pro
                    </a>
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
            {/* Center: Live Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium">Portfolio is live</span>
            </div>
            </div>

        </div>
      </div>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40 lg:hidden" 
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Modal Content */}
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
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer border-b border-gray-50"><a href="">Preview Website</a></li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"><a href="">Open Bookings</a></li>
              <li className="px-4 py-2">
                <button className="w-full bg-green-50 text-gray-900 py-2 rounded-full text-sm font-bold">
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
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"><a href="/business/login">Sign out</a></li>
            </ul>
          </div>
        </>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50" 
            onClick={() => setIsSettingsOpen(false)}
          />
          {/* Modal Content */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Plan Comparison */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Plan Comparison</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Basic Plan */}
                  <div className="border border-border rounded-xl p-5">
                    <div className="mb-3">
                      <h4 className="text-base font-semibold text-gray-900">Basic Plan</h4>
                      <p className="text-2xl font-bold text-gray-900 mt-1">Free</p>
                    </div>
                    <ul className="space-y-2 text-sm text-textSecondaryColor">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Basic portfolio website</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Up to 5 projects showcase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Standard templates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Fortly branding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5">×</span>
                        <span className="text-gray-400">Custom domain</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-300 mt-0.5">×</span>
                        <span className="text-gray-400">Advanced analytics</span>
                      </li>
                    </ul>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-green-500 rounded-xl p-5 relative bg-green-50">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      RECOMMENDED
                    </div>
                    <div className="mb-3">
                      <h4 className="text-base font-semibold">Pro Plan</h4>
                      <p className="text-2xl font-bold mt-1">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
                    </div>
                    <ul className="space-y-2 text-sm text-textSecondaryColor">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Everything in Basic</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Unlimited projects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Premium templates</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Custom domain support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Remove Fortly branding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Advanced analytics & insights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-2 border-red-200 rounded-xl p-5 bg-red-50">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
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