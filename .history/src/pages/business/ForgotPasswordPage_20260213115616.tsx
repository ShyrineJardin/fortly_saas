import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import Login from '../../components/business/ForgotPassword'

export default function ForgotPasswordPage() {
  console.log('ForgotPasswordPage rendering...')
  
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