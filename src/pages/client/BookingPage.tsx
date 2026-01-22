import React from 'react'
import Booking from '../../components/client/Booking'
export default function BookingPage() {
  console.log('BookingPage rendering...')
  
  try {
    return<Booking />
  } catch (error) {
    console.error('Error in BookingPage:', error)
    return <div>Error: {String(error)}</div>
  }
}