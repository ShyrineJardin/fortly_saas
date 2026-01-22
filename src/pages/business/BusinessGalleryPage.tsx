import React from 'react'
import BusinessGallery from '../../components/business/BusinessGallery'


export default function BusinessGalleryPage() {
  console.log('BusinessGalleryPage rendering...')
  
  try {
    return <BusinessGallery />
  } catch (error) {
    console.error('Error in BusinessGalleryPage:', error)
    return <div>Error: {String(error)}</div>
  }
}