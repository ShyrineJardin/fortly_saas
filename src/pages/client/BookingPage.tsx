import React from 'react'
import ClientLayout from '../../components/layout/ClientLayout'
import ClientSidebar from '../../components/client/ClientSidebar'
import Booking from '../../components/client/Booking'
import Footer from '../../components/client/Footer'
export default function BookingPage() {
  console.log('BookingPage rendering...')
  
  try {
    return (
      <ClientLayout
        sidebar={<ClientSidebar />}
        footer={<Footer />}
      >
        <Booking />
      </ClientLayout>
    )
  } catch (error) {
    console.error('Error in BookingPage:', error)
    return <div>Error: {String(error)}</div>
  }
}