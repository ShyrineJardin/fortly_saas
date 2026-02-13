import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI, setAuthToken } from '../../utils/api';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if there's an error from OAuth redirect
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(oauthError);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      setAuthToken(response.data.token);

      // ✅ SAVE BUSINESS SLUG TO LOCALSTORAGE
      if (response.data.business.slug) {
        localStorage.setItem('businessSlug', response.data.business.slug);
        console.log('✅ Saved businessSlug:', response.data.business.slug);
      }
      
      // Navigate based on onboarding status
      if (response.data.business.onboardingCompleted) {
        navigate('/business/gallery');
      } else {
        navigate('/business/onboarding');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex justify-center p-4">
      <div className="w-full max-w-md">

        {/* Login Form */}
        <div className='flex flex-col text-center'>
          <h2 className="lg:text-3xl text-2xl font-semibold text-textPrimaryColor"> Welcome back👋</h2>
          <p className="text-textSecondaryColor lg:text-base text-sm mb-6">Your portfolio. Your bookings. All in one.</p>
            

          <div className="space-y-5 text-start">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-textPrimaryColor mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="text-sm w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent bg-white text-textPrimaryColor"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-textPrimaryColor mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="text-sm w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent pr-12 bg-white text-textPrimaryColor"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-textSecondaryColor hover:text-textPrimaryColor transition duration-200"
                  disabled={loading}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
            
              <Link 
                to="/business/forgot-password" 
                className="text-sm text-primaryGreen hover:text-hoverGreen font-medium transition duration-200"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message*/}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left animate-fadeIn">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-primaryGreen hover:bg-hoverGreen text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-textSecondaryColor">or</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white border border-border hover:bg-gray-50 text-textPrimaryColor font-medium px-4 py-2 rounded-3xl transition duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.8 10.2273C19.8 9.51821 19.7364 8.83639 19.6182 8.18185H10.2V12.0501H15.5818C15.3364 13.3001 14.6182 14.3592 13.5455 15.0682V17.5773H16.8182C18.7091 15.8364 19.8 13.2728 19.8 10.2273Z" fill="#4285F4"/>
              <path d="M10.2 20C12.9 20 15.1727 19.1046 16.8182 17.5773L13.5455 15.0682C12.6273 15.6682 11.4818 16.0228 10.2 16.0228C7.59545 16.0228 5.37273 14.2637 4.56364 11.9H1.18182V14.4909C2.81818 17.7591 6.26364 20 10.2 20Z" fill="#34A853"/>
              <path d="M4.56364 11.9C4.35455 11.3 4.23636 10.6591 4.23636 10C4.23636 9.34091 4.35455 8.7 4.56364 8.1V5.50909H1.18182C0.509091 6.85909 0.136364 8.38636 0.136364 10C0.136364 11.6136 0.509091 13.1409 1.18182 14.4909L4.56364 11.9Z" fill="#FBBC04"/>
              <path d="M10.2 3.97727C11.6 3.97727 12.8455 4.48182 13.8182 5.40909L16.7364 2.49091C15.1682 1.02273 12.8955 0.136364 10.2 0.136364C6.26364 0.136364 2.81818 2.37727 1.18182 5.50909L4.56364 8.1C5.37273 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-textSecondaryColor mt-6">
            Don't have an account?{' '}
            <a href="/business/signup" className="text-primaryGreen hover:text-hoverGreen font-semibold transition duration-200">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}