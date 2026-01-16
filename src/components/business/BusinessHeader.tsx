import React, { useState } from 'react';
import { IoCopyOutline, IoMenuOutline} from "react-icons/io5";
import { HiOutlineChat } from "react-icons/hi";

export default function BusinessHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChatClick = () => {
    window.dispatchEvent(new CustomEvent('openChat'));
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
            <div className="flex items-center gap-2 px-3 py-1 bg-softGreen text-hoverGreen rounded-full border border-green-100">
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
                    <a href='/' className="text-sm text-textSecondaryColor hover:text-hoverGreen transition-colors font-medium">
                    Open Bookings
                    </a>
                    <a href='/' className="bg-softGreen text-textPrimaryColor px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-opacity-80 transition-colors">
                    Unlock Pro
                    </a>
                    <a href='/' className="text-sm text-textSecondaryColor hover:text-hoverGreen transition-colors">
                    Settings
                    </a>
                    <a href='/business/login' className="text-sm text-textSecondaryColor hover:text-hoverGreen transition-colors">
                    Sign out
                    </a>
                </div>
            </div>
          

           <div className='flex items-center justify-center'>
            {/* Center: Live Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-softGreen text-hoverGreen rounded-full border border-green-100">
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
              </li>              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer border-b border-gray-50"><a href="">Preview Website</a></li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"><a href="">Open Bookings</a></li>
              <li className="px-4 py-2">
                <button className="w-full bg-softGreen text-textPrimaryColor py-2 rounded-full text-sm font-bold">
                  Unlock Pro
                </button>
              </li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"><a href="">Settings</a></li>
              <li className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"><a href="/business/login">Sign out</a></li>
            </ul>
          </div>
        </>
      )}
    </header>
  );
}