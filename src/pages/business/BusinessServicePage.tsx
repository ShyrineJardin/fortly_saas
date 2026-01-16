import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import BusinessTopTabs from '../../components/business/BusinessTopTabs'
import Footer from '../../components/client/Footer'
import BusinessSidebar from '../../components/business/BusinessSidebar'
import BusinessService from '../../components/business/BusinessService'

export default function BusinessReviewPage() {
  console.log('BusinessGalleryPage rendering...')
  
  try {
    return (
      <BusinessLayout showBusinessHeader={true} 
          sidebar={<BusinessSidebar />}
          footer={<Footer />}
        >
        <BusinessTopTabs />
        <BusinessService />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in BusinessReviewPage:', error)
    return <div>Error: {String(error)}</div>
  }
}