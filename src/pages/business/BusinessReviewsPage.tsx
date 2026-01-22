import React from 'react'
import BusinessReview from '../../components/business/BusinessReview'

export default function BusinessReviewPage() {
  console.log('BusinessGalleryPage rendering...')
  
  try {
    return <BusinessReview />
  } catch (error) {
    console.error('Error in BusinessReviewPage:', error)
    return <div>Error: {String(error)}</div>
  }
}