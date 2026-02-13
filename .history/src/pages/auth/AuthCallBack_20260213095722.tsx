import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAuthToken } from '../../utils/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const slug = searchParams.get('slug');
    const onboarding = searchParams.get('onboarding');
    const error = searchParams.get('error');

    if (error) {
      navigate('/business/login?error=Google sign-in failed. Please try again.');
      return;
    }

    if (token) {
      // Save token
      setAuthToken(token);
      
      // Save business slug to localStorage
      if (slug) {
        localStorage.setItem('businessSlug', slug);
        console.log('✅ Saved businessSlug:', slug);
      }

      // Navigate based on onboarding status
      if (onboarding === 'true') {
        navigate('/business/gallery');
      } else {
        navigate('/business/onboarding');
      }
    } else {
      navigate('/business/login?error=Authentication failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}