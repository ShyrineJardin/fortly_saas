import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await authAPI.forgotPassword({ email });
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center p-4 bg-backgroundColor">
      <div className="w-full max-w-md">
        <div className='flex flex-col text-center'>
          <h2 className="lg:text-3xl text-2xl font-semibold text-textPrimaryColor">Forgot Password?</h2>
          <p className="text-textSecondaryColor lg:text-base text-sm mb-6">
            No worries! Enter your email and we'll send you reset instructions.
          </p>

          {success ? (
            <div className="mb-6 p-4 bg-softGreen border border-primaryGreen rounded-lg text-textPrimaryColor text-sm text-left animate-slideUp">
              <h3 className="font-semibold mb-1 text-hoverGreen">Check your email!</h3>
              <p>We've sent password reset instructions to your email address. Please check your inbox and spam folder.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-start">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-textPrimaryColor mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="text-sm w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent bg-white text-textPrimaryColor"
                  required
                  disabled={loading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-left animate-fadeIn">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primaryGreen hover:bg-hoverGreen text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link 
              to="/business/login" 
              className="text-sm text-primaryGreen hover:text-hoverGreen font-medium inline-flex items-center gap-1 transition duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}