import React from 'react'
import ClientLayout from '../../components/layout/ClientLayout'
import ClientSidebar from '../../components/client/ClientSidebar'
import Footer from '../../components/client/Footer'
import TopTabs from '../../components/client/TopTabs'
import Service from '../../components/client/Service'

export default function ServicesPage() {
  return (
    <ClientLayout
      sidebar={<ClientSidebar />}
      footer={<Footer />}
    >
      <TopTabs />
      <Service />
    </ClientLayout>
  )
}