import React from 'react'
import ChatWidget from '../client/Chat'

type Props = {
  sidebar: React.ReactElement
  children: React.ReactNode
  footer?: React.ReactElement
}

export default function ClientLayout({ sidebar, children, footer }: Props) {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Mobile header only - rendered by sidebar component */}
      <div className='lg:hidden'>
        {sidebar}
      </div>
      
      <div className='flex flex-1'>
        {/* Desktop Sidebar - Only visible on desktop */}
        <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
          {sidebar}
        </aside>

        {/* Main Content */}
        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {children}
        </main>
      </div>
      
      {footer && (
        <footer className='bg-footerBackground mt-auto'>
          {footer}
        </footer>
      )}

      {/* Chat Widget - visible on all pages using ClientLayout */}
      <ChatWidget />
    </div>
  )
}