import React, { useEffect, useState } from 'react'
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

export default function BusinessLayout({ sidebar, children, footer, showHeader, showBusinessHeader }: Props) {
  const [businessSlug, setBusinessSlug] = useState<string>('')

  useEffect(() => {
    // ✅ First check localStorage for quick initial render
    const cachedSlug = localStorage.getItem('businessSlug')
    if (cachedSlug) {
      setBusinessSlug(cachedSlug)
    }

    const fetchBusinessSlug = async () => {
      try {
        const response = await authAPI.getMe()
        const freshSlug = response.data.business?.slug
        
        if (freshSlug) {
          setBusinessSlug(freshSlug)
          localStorage.setItem('businessSlug', freshSlug)
          
          // ✅ Log if slug changed
          if (cachedSlug && cachedSlug !== freshSlug) {
            console.log('✅ Slug updated:', cachedSlug, '→', freshSlug)
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch business slug:', error)
      }
    }

    fetchBusinessSlug()
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

      {businessSlug && (
        <BusinessChat
          businessSlug={businessSlug} 
          apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
        />
      )}
    </div>
  )
}