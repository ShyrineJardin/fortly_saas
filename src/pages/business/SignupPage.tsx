import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import Signup from '../../components/business/Signup'

export default function SignupPage() {
  console.log('SignupPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true}>
        <Signup />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in SignupPage:', error)
    return <div>Error: {String(error)}</div>
  }
}