import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaImage, FaStar } from 'react-icons/fa6'
import { FiCalendar } from "react-icons/fi"

export default function BusinessTopTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { name: "Gallery", icon: FaImage, path: "/business/gallery" },
    { name: "Services", icon: FiCalendar, path: "/business/services" },
    { name: "Reviews", icon: FaStar, path: "/business/reviews" }
  ]

  // Determine active tab based on current path
  const getActiveTab = () => {
    const currentPath = location.pathname
    if (currentPath.includes('/business/services')) return 'Services'
    if (currentPath.includes('/business/reviews')) return 'Reviews'
    return 'Gallery'
  }

  const activeTab = getActiveTab()

  return (
    <div className='flex justify-center gap-6 lg:gap-20 mb-4 lg:mb-6 border-b border-gray-100 w-full'>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name

        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 pb-3 transition-all relative flex-1 lg:flex-initial ${
              isActive ? 'text-primaryGreen' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            {/* Icon - smaller on mobile, larger on desktop */}
            <span className="text-xl lg:text-2xl">
              {tab.icon({})}
            </span>

            {/* Label - smaller text on mobile */}
            <span className="font-poppins font-medium text-xs lg:text-sm">
              {tab.name}
            </span>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 w-full h-[3px] bg-primaryGreen rounded-t-md" />
            )}
          </button>
        )
      })}
    </div>
  )
}