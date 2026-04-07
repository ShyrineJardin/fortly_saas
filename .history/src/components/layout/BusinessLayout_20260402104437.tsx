import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import HeaderLogo from '../business/HeaderLogo'
import BusinessHeader from '../business/BusinessHeader'
import BusinessChat from '../business/BusinessChat'
import { authAPI } from '../../utils/api'

type Props = {
  sidebar?: React.ReactElement
  children: React.ReactNode
  footer?: React.ReactElement
  showHeader?: boolean
  showBusinessHeader?: boolean
}

const AUTH_ROUTES = [
  '/business/login',
  '/business/signup',
  '/business/onboarding',
  '/business/forgot-password',
  '/business/reset-password',
  '/auth/callback',
]

export default function BusinessLayout({ sidebar, children, footer, showHeader, showBusinessHeader }: Props) {
  const [businessSlug, setBusinessSlug] = useState<string>('')
  const { pathname } = useLocation()

  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  const fetchAndSetSlug = async () => {
    try {
      const response = await authAPI.getMe()
      const freshSlug = response.data.business?.slug
      if (freshSlug) {
        setBusinessSlug(freshSlug)
        localStorage.setItem('businessSlug', freshSlug)
      }
    } catch (error) {
      // No token or invalid token — clear stale cached slug
      localStorage.removeItem('businessSlug')
      setBusinessSlug('')
    }
  }

  useEffect(() => {
    if (isAuthRoute) return   // ← don't fetch on login/signup/onboarding

    // Seed from cache immediately to avoid flash
    const cachedSlug = localStorage.getItem('businessSlug')
    if (cachedSlug) setBusinessSlug(cachedSlug)

    fetchAndSetSlug()
  }, [pathname])  // ← re-run when navigating (catches post-onboarding redirect)

  useEffect(() => {
    // Listen for onboarding/profile updates that change the slug
    const handleSlugUpdate = (e: Event) => {
      const { slug } = (e as CustomEvent<{ slug: string }>).detail
      if (slug) {
        setBusinessSlug(slug)
        localStorage.setItem('businessSlug', slug)
      }
    }
    window.addEventListener('businessSlugUpdated', handleSlugUpdate)
    return () => window.removeEventListener('businessSlugUpdated', handleSlugUpdate)
  }, [])

  return (
    <div className='flex flex-col min-h-screen'>
      {showHeader && <HeaderLogo />}
      {showBusinessHeader && <BusinessHeader />}

      {sidebar && <div className='lg:hidden'>{sidebar}</div>}

      <div className='flex flex-1'>
        {sidebar && (
          <aside className='hidden lg:flex w-80 p-6 overflow-y-auto'>
            {sidebar}
          </aside>
        )}

        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {children}
        </main>
      </div>

      {footer && (
        <footer className='bg-footerBackground mt-auto'>
          {footer}
        </footer>
      )}

      {!isAuthRoute && businessSlug && (
        <BusinessChat
          businessSlug={businessSlug}
          apiBaseUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
        />
      )}
    </div>
  )
}