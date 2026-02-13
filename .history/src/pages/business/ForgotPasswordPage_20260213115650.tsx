import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import ForgotPassword from '../../components/business/ForgotPassword'import Login from '../../components/business/Login'
../../components/business/ForgotPassword'

export default function ForgotPasswordPage() {
  console.log('ForgotPasswordPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true}>
        <Login />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in ForgotPasswordPage:', error)
    return <div>Error: {String(error)}</div>
  }
}