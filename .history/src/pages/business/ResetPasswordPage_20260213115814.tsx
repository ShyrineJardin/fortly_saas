import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import ResetPassword from '../../components/business/ResetPassword'
import ForgotPassword from '../../components/business/ForgotPassword'

export default function ResetPasswordPage() {
  console.log('ResetPasswordPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true}>
        <ResetPassword />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in ResetPasswordPage:', error)
    return <div>Error: {String(error)}</div>
  }
}