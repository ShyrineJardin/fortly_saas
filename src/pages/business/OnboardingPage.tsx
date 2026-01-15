import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import Onboarding from '../../components/business/Onboarding'
import Footer from '../../components/client/Footer'

export default function OnboardingPage() {
  console.log('OnboardingPage rendering...')
  
  try {
    return (
      <BusinessLayout showHeader={true} footer={<Footer />} >
        <Onboarding />
        
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in OnboardingPage:', error)
    return <div>Error: {String(error)}</div>
  }
}