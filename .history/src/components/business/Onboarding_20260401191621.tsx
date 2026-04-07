import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaAngleUp, FaAngleDown } from 'react-icons/fa6'
import { authAPI, businessAPI } from '../../utils/api'

export default function Onboarding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [businessName, setBusinessName] = useState('')
  
  const [formData, setFormData] = useState({
    ownerName: '',
    category: '',
    phone: '',
    location: '',
    tagline: '',
    description: '',
    logo: null as File | null,
  })

  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const businessCategories = [
    'Salon / Spa',
    'Restaurant',
    'Retail Store',
    'Fitness Center',
    'Consulting',
    'Photography',
    'Healthcare',
    'Education',
    'Event Planning',
    'Home Services',
    'Other'
  ]

  // Fix 1: Define generateSlugPreview inside the component
  const generateSlugPreview = (name: string) => {
    if (!name) return ''
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  // Fix 2: Use businessName state, not formData.businessName (which doesn't exist)
  const slugPreview = generateSlugPreview(businessName)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authAPI.getMe()
        const business = response.data.business

        const businessNameValue = business.businessName === 'New Business' 
          ? '' 
          : business.businessName;

        setBusinessName(businessNameValue)

        setFormData(prev => ({
          ...prev,
          ownerName: business.ownerName || '',
          category: business.category || '',
          phone: business.phone || '',
          location: business.location || '',
          tagline: business.tagline || '',
          description: business.description || '',
        }))

        if (business.logo && business.logo !== '') {
          setLogoPreview(business.logo)
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError('Failed to load business data')
      }
    }

    fetchUserData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSelectCategory = (category: string) => {
    setFormData({ ...formData, category })
    setIsCategoryOpen(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }
      setFormData({ ...formData, logo: file })
      setLogoPreview(URL.createObjectURL(file))
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (!formData.ownerName.trim()) {
      setError('Owner name is required')
      return
    }
    if (!formData.category) {
      setError('Please select a business category')
      return
    }
  
    setLoading(true)
  
    try {
      const data = new FormData()
      data.append('businessName', businessName)
      data.append('ownerName', formData.ownerName)
      data.append('category', formData.category)
      data.append('phone', formData.phone)
      data.append('location', formData.location)
      data.append('tagline', formData.tagline)
      data.append('description', formData.description)
    
      if (formData.logo) {
        data.append('logo', formData.logo)
      }
    
      const response = await businessAPI.completeOnboarding(data)
      console.log('Onboarding completed:', response.data)
      
      window.location.href = '/business/gallery'
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.response?.data?.message || 'Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-10">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="lg:text-3xl text-2xl font-semibold mb-1">
            Great! Tell us about your business 🚀
          </h1>
          <p className="text-textSecondaryColor lg:text-base text-sm mb-6">
            Let's introduce your business to your future clients
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Logo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
                disabled={loading}
              />
              <label htmlFor="logo" className="cursor-pointer">
                {logoPreview ? (
                  <div className="space-y-2">
                    <img src={logoPreview} alt="Logo preview" className="w-32 h-32 object-cover mx-auto rounded-lg" />
                    <p className="text-sm text-emerald-600">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-4xl text-gray-400">📷</div>
                    <p className="text-sm text-gray-500">Click to upload logo</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Row 1: Business Name & Owner's Full Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter your business name"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
                required
              />
              {/* Fix 2: slugPreview now correctly reads from businessName state */}
              {slugPreview && (
                <p className="mt-1 text-xs text-gray-500">
                  Your page will be: <span className="font-medium text-emerald-600">
                    fortly.xyz/{slugPreview}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-2">
                Owner's Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Enter owner's full name"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Row 2: Business Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                What type of business are you? <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-left flex items-center justify-between"
                  disabled={loading}
                >
                  <span className={formData.category ? 'text-gray-800' : 'text-gray-400'}>
                    {formData.category || 'Select category'}
                  </span>
                  {isCategoryOpen ? FaAngleUp ({className:"text-gray-400" }) : FaAngleDown ({className:"text-gray-400"})}
                </button>
                
                {isCategoryOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {businessCategories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleSelectCategory(category)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-emerald-50 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Optional Details Divider */}
          <div className="pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Optional details</h3>
          </div>

          {/* Row 3: Phone Number & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter location"
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Row 4: Tagline & Short Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
                Tagline
              </label>
              <textarea
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="A catchy phrase about your business"
                rows={4}
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Short description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us about your business"
                rows={4}
                className="text-sm w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}