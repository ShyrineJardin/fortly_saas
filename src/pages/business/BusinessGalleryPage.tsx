import React from 'react'
import BusinessLayout from '../../components/layout/BusinessLayout'
import BusinessGallery from '../../components/business/BusinessGallery'
import BusinessTopTabs from '../../components/business/BusinessTopTabs'
import Footer from '../../components/client/Footer'
import BusinessSidebar from '../../components/business/BusinessSidebar'

export default function BusinessGalleryPage() {
  console.log('BusinessGalleryPage rendering...')
  
  try {
    return (
      <BusinessLayout showBusinessHeader={true} 
          sidebar={<BusinessSidebar />}
          footer={<Footer />}
        >
        <BusinessTopTabs />
        <BusinessGallery />
      </BusinessLayout>
    )
  } catch (error) {
    console.error('Error in BusinessGalleryPage:', error)
    return <div>Error: {String(error)}</div>
  }
}