import React from 'react'
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
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header - can be toggled */}
      {showHeader && <HeaderLogo />}
      
      {/* Mobile header from sidebar if provided */}
      {sidebar && (
        <div className='lg:hidden'>
          {sidebar}
        </div>
      )}

      {/* Business Header  */}
      {showBusinessHeader && <BusinessHeader />}
      
      <div className='flex flex-1'>
        {/* Desktop Sidebar - Only visible on desktop if provided */}
        {sidebar && (
          <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {children}
        </main>
      </div>

      {/* Render sidebar outside the aside for mobile modal */}
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

      <BusinessChat />

    </div>

  )
}