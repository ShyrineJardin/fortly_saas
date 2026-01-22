import React from 'react'
import BusinessService from '../../components/business/BusinessService'

export default function BusinessReviewPage() {
  console.log('BusinessGalleryPage rendering...')
  
  try {
    return <BusinessService />
  } catch (error) {
    console.error('Error in BusinessReviewPage:', error)
    return <div>Error: {String(error)}</div>
  }
}