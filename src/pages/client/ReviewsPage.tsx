import React from 'react'
import ClientLayout from '../../components/layout/ClientLayout'
import ClientSidebar from '../../components/client/ClientSidebar'
import Footer from '../../components/client/Footer'
import TopTabs from '../../components/client/TopTabs'
import Review from '../../components/client/Review'

export default function ReviewsPage() {
  return (
    <ClientLayout
      sidebar={<ClientSidebar />}
      footer={<Footer />}
    >
      <TopTabs />
      <Review />
    </ClientLayout>
  )
}