import React, { useState, useEffect } from 'react'
import ChatWidget from '../client/Chat' 
import AppointmentWidget from '../client/Appointment'
import { useParams } from 'react-router-dom'

type Props = {
  sidebar: React.ReactElement
  children: React.ReactNode
  footer?: React.ReactElement
}

export default function ClientBookingLayout({ sidebar, children, footer }: Props) {
  const { businessSlug } = useParams()
  const [clientEmail, setClientEmail] = useState('')

  useEffect(() => {
    // Read email from chat localStorage (set when user uses chat)
    const chatEmail = localStorage.getItem(`chat_${businessSlug}_email`)
    if (chatEmail) setClientEmail(chatEmail)

    // Also read email from booking confirmation (set after booking)
    const bookingEmail = localStorage.getItem(`booking_${businessSlug}_email`)
    if (bookingEmail) setClientEmail(bookingEmail)

    // Listen for storage changes (e.g. after chat form or booking submit)
    const handleStorageChange = () => {
      const updatedChatEmail = localStorage.getItem(`chat_${businessSlug}_email`)
      const updatedBookingEmail = localStorage.getItem(`booking_${businessSlug}_email`)
      setClientEmail(updatedBookingEmail || updatedChatEmail || '')
    }

    window.addEventListener('storage', handleStorageChange)
    // Also listen for custom event (same-tab updates)
    window.addEventListener('clientEmailUpdated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('clientEmailUpdated', handleStorageChange)
    }
  }, [businessSlug])

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

      <AppointmentWidget
        businessSlug={businessSlug || ""}
        clientEmail={clientEmail}
      />

      <ChatWidget 
        businessSlug={businessSlug || ""} 
        apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
      />
    </div>
  )
}