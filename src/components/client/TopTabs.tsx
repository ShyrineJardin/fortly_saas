import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FaImage, FaStar } from 'react-icons/fa6'
import { FiCalendar } from "react-icons/fi"

export default function TopTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { name: "Gallery", icon: FaImage, path: "/gallery" },
    { name: "Services", icon: FiCalendar, path: "/services" },
    { name: "Reviews", icon: FaStar, path: "/reviews" }
  ]

  // Determine active tab based on current path
  const getActiveTab = () => {
    const currentPath = location.pathname
    if (currentPath.includes('/services')) return 'Services'
    if (currentPath.includes('/reviews')) return 'Reviews'
    return 'Gallery'
  }

  const activeTab = getActiveTab()

  return (
    <div className='flex justify-center gap-12 mb-6 border-b border-gray-100 w-full'>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name

        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 pb-3 transition-all relative ${
              isActive ? 'text-primaryGreen' : 'text-textSecondary hover:text-textPrimary'
            }`}
          >
            <span className="text-2xl">
              {tab.icon({})}
            </span>

            <span className="font-poppins font-medi text-sm">
              {tab.name}
            </span>

            {isActive && (
              <div className="absolute bottom-0 w-full h-[3px] bg-primaryGreen rounded-t-md" />
            )}
          </button>
        )
      })}
    </div>
  )
}