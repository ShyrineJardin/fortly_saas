import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import ResetPassword from '../../components/business/ResetPassword'

export default function ForgotPasswordPage() {
  console.log('ForgotPasswordPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true}>
        <ForgotPassword />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in ForgotPasswordPage:', error)
    return <div>Error: {String(error)}</div>
  }
}