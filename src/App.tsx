import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom"
import GalleryGrid from "./components/client/GalleryGrid"
import ServicesPage from "./pages/client/ServicesPage"
import ReviewsPage from "./pages/client/ReviewsPage"
import BookingPage from "./pages/client/BookingPage"
import ConfirmationPage from "./pages/client/ConfirmationPage"
import Chat from "./components/client/Chat"

import LoginPage from './pages/business/LoginPage'
import SignupPage from './pages/business/SignupPage'
import OnboardingPage from './pages/business/OnboardingPage'
import BusinessGallery from './components/business/BusinessGallery'
import BusinessReviewsPage from "./pages/business/BusinessReviewsPage"
import BusinessServicePage from "./pages/business/BusinessServicePage"
import BusinessChat from "./components/business/BusinessChat"

// Shared layout for CLIENT pages
import ClientLayout from "./components/layout/ClientLayout"
import ClientSidebar from "./components/client/ClientSidebar"
import Footer from "./components/client/Footer"
import TopTabs from "./components/client/TopTabs"

// Shared layout for BUSINESS pages
import BusinessLayout from "./components/layout/BusinessLayout"
import BusinessSidebar from "./components/business/BusinessSidebar"
import BusinessTopTabs from "./components/business/BusinessTopTabs"

// Client pages wrapper - layout renders once
function ClientPageLayout() {
  return (
    <ClientLayout
      sidebar={<ClientSidebar />}
      footer={<Footer />}
    >
      <TopTabs />
      <Outlet />
    </ClientLayout>
  )
}

// Business pages wrapper - layout renders once
function BusinessPageLayout() {
  return (
    <BusinessLayout 
      showBusinessHeader={true}
      sidebar={<BusinessSidebar />}
      footer={<Footer />}
    >
      <BusinessTopTabs />
      <Outlet />
    </BusinessLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Business Authentication Routes (no shared layout) */}
        <Route path="/business/login" element={<LoginPage />} />
        <Route path="/business/signup" element={<SignupPage />} />
        <Route path="/business/onboarding" element={<OnboardingPage />} />
        
        {/* Business Dashboard Routes - WITH SHARED LAYOUT */}
        <Route path="/business" element={<BusinessPageLayout />}>
          <Route index element={<Navigate to="gallery" replace />} />
          <Route path="gallery" element={<BusinessGallery />} />
          <Route path="reviews" element={<BusinessReviewsPage />} />
          <Route path="services" element={<BusinessServicePage />} />
          <Route path="chat" element={<BusinessChat />} />
        </Route>

        {/* Client Routes - WITH SHARED LAYOUT */}
        <Route path="/:businessSlug" element={<ClientPageLayout />}>
          <Route index element={<Navigate to="gallery" replace />} />
          <Route path="gallery" element={<GalleryGrid />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="chat" element={<Chat />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/business/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}