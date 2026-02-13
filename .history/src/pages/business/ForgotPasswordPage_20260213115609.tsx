import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import Login from '../../components/business/Fn'

export default function LoginPage() {
  console.log('LoginPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true}>
        <Login />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in LoginPage:', error)
    return <div>Error: {String(error)}</div>
  }
}