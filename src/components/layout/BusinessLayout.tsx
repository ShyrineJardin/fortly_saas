import React, { useEffect, useState } from 'react'
import HeaderLogo from '../business/HeaderLogo'
import BusinessHeader from '../business/BusinessHeader'
import BusinessChat from '../business/BusinessChat'

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
    const slug = localStorage.getItem('businessSlug')
    console.log('🔍 BusinessSlug from localStorage:', slug)
    if (slug) {
      setBusinessSlug(slug)
    }
  }, [])
  
  return (
    <div className='flex flex-col min-h-screen'>
      {showHeader && <HeaderLogo />}
      
      {sidebar && (
        <div className='lg:hidden'>
          {sidebar}
        </div>
      )}

      {showBusinessHeader && <BusinessHeader />}
      
      <div className='flex flex-1'>
        {sidebar && (
          <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
            {sidebar}
          </aside>
        )}

        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {children}
        </main>
      </div>

      {sidebar && (
        <div className='lg:hidden'>
          {sidebar}
        </div>
      )}
      
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