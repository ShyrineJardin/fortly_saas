import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div
        className={`text-center transition-all duration-700 ease-out ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Animated circle */}
        <div className="relative flex items-center justify-center mx-auto mb-8 w-40 h-40">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="absolute inset-2 rounded-full bg-emerald-100 animate-ping opacity-20"
            style={{ animationDelay: '0.3s' }} />
          {/* Icon circle */}
          <div className="relative w-32 h-32 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-emerald-100">
            <svg className="w-14 h-14 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* 404 number */}
        <div
          className={`transition-all duration-700 delay-150 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-8xl font-black text-emerald-600 mb-2 tracking-tight leading-none">
            404
          </h1>
        </div>

        {/* Text */}
        <div
          className={`transition-all duration-700 delay-300 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Business Not Found
          </h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            The business page you're looking for doesn't exist or may have been removed.
          </p>
        </div>

        {/* Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-3 justify-center transition-all duration-700 delay-500 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-white text-gray-700 rounded-xl font-semibold shadow-md border border-gray-200 hover:bg-gray-50 hover:shadow-lg transition-all duration-200"
          >
            ← Go Back
          </button>
          <button
            onClick={() => window.location.href = 'https://fortly.xyz'}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all duration-200"
          >
            Visit Fortly
          </button>
        </div>

        {/* Subtle footer */}
        <p
          className={`mt-10 text-xs text-gray-400 transition-all duration-700 delay-700 ease-out ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Powered by{' '}
          <a href="https://fortly.xyz" className="text-emerald-500 hover:underline font-medium">
            Fortly
          </a>
        </p>
      </div>
    </div>
  )
}