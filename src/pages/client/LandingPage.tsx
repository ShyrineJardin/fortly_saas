import ClientLayout from "../../components/layout/ClientLayout"
import GalleryGrid from "../../components/client/GalleryGrid"
import TopTabs from "../../components/client/TopTabs"
import ClientSidebar from "../../components/client/ClientSidebar"
import Footer from "../../components/client/Footer"

export default function LandingPage() {

  return (
    <ClientLayout sidebar={<ClientSidebar />} footer={<Footer />}>
      <TopTabs />
      <GalleryGrid />
    </ClientLayout>
  )
}