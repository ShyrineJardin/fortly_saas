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
        <div className="relative flex items-center justify-center mx-auto mb-8 w-52 h-52 md:w-80 md:h-80">
          <img
            src="/404-planet-animation.gif"
            alt="Planet animation"
            className="w-full h-full object-contain"
          />
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

      </div>
    </div>
  )
}