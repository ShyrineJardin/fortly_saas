import React from 'react'
import ClientLayout from '../../components/layout/ClientLayout'
import ClientSidebar from '../../components/client/ClientSidebar'
import Footer from '../../components/client/Footer'
import TopTabs from '../../components/client/TopTabs'
import GalleryGrid from '../../components/client/GalleryGrid'

export default function GalleryPage() {
  console.log('GalleryPage rendering...')
  
  try {
    return <GalleryGrid />
  } catch (error) {
    console.error('Error in GalleryPage:', error)
    return <div>Error: {String(error)}</div>
  }
}