import React from 'react'
import ChatWidget from '../client/Chat' 
import { useParams } from 'react-router-dom'

type Props = {
  sidebar: React.ReactElement
  children: React.ReactNode
  footer?: React.ReactElement
}

export default function ClientLayout({ sidebar, children, footer }: Props) {
  const { businessSlug } = useParams()
  
  return (
    <div className='flex flex-col min-h-screen'>
      <div className='lg:hidden'>
        {sidebar}
      </div>
      
      <div className='flex flex-1'>
        <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
          {sidebar}
        </aside>
        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {children}
        </main>
      </div>
      
      {footer && (
        <footer className='bg-footerBackground mt-auto'>
          {footer}
        </footer>
      )}

      <ChatWidget 
        businessSlug={businessSlug || ""} 
        apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
      />
    </div>
  )
}