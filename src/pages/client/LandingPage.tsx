import ClientLayout from "../../components/layout/ClientLayout"
import GalleryGrid from "../../components/client/GalleryGrid"
import TopTabs from "../../components/client/TopTabs"
import ClientSidebar from "../../components/client/ClientSidebar"
import Footer from "../../components/client/Footer"
// import { useEffect } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'

export default function LandingPage() {
  // const navigate = useNavigate()
  // const { businessSlug } = useParams()

  // useEffect(() => {
  //   navigate(`/${businessSlug}/gallery`, { replace: true })
  // }, [businessSlug, navigate])

  return (
    <ClientLayout sidebar={<ClientSidebar />} footer={<Footer />}>
      <TopTabs />
      <GalleryGrid />
    </ClientLayout>
  )
}