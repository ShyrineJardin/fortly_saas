import React from 'react'
import Footer from '../../components/client/Footer'
import ConfirmationLayout from '../../components/layout/ConfirmationLayout'
import Confirmation from '../../components/client/Confirmation'

export default function ConfirmationPage() {
  console.log('ConfirmationPage rendering...')
  
  try {
    return (
      <ConfirmationLayout   
        footer={<Footer />}
      >
        <Confirmation />
      </ConfirmationLayout>
    )
  } catch (error) {
    console.error('Error in ConfirmationPage:', error)
    return <div>Error: {String(error)}</div>
  }
}