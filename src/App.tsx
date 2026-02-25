import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom"
import { useState } from "react"
import GalleryGrid from "./components/client/GalleryGrid"
import ServicesPage from "./pages/client/ServicesPage"
import ReviewsPage from "./pages/client/ReviewsPage"
import BookingPage from "./pages/client/BookingPage"
import ConfirmationPage from "./pages/client/ConfirmationPage"

import LoginPage from './pages/business/LoginPage'
import SignupPage from './pages/business/SignupPage'
import OnboardingPage from './pages/business/OnboardingPage'
import BusinessGallery from './components/business/BusinessGallery'
import BusinessReviewsPage from "./pages/business/BusinessReviewsPage"
import BusinessServicePage from "./pages/business/BusinessServicePage"
import BusinessCalendar from "./components/business/BusinessCalendar"
import AuthCallback from './components/shared/AuthCallback';
import ResetPasswordPage from "./pages/business/ResetPasswordPage"
import ForgotPasswordPage from './pages/business/ForgotPasswordPage';

// Shared layout components
import ClientSidebar from "./components/client/ClientSidebar"
import Footer from "./components/client/Footer"
import TopTabs from "./components/client/TopTabs"
import ChatWidget from "./components/client/Chat"
import AppointmentWidget from "./components/client/Appointment"
import BusinessLayout from "./components/layout/BusinessLayout"
import BusinessSidebar from "./components/business/BusinessSidebar"
import BusinessTopTabs from "./components/business/BusinessTopTabs"

import { useBusinessMeta } from "./hooks/useBusinessMeta"

// Unified Client Layout (for gallery, services, reviews, booking)
function UnifiedClientLayout() {
  const location = useLocation()
  const { pathname } = location
  
  const isBookingFlow = pathname.includes('/booking')
  const isConfirmationFlow = pathname.includes('/confirmation')
  
  const businessSlug = pathname.split('/')[1] || ""
  const clientEmail = localStorage.getItem(`chat_${businessSlug}_email`) 
    || localStorage.getItem(`booking_${businessSlug}_email`) 
    || ""
  
  return (
    <div className='flex flex-col min-h-screen'>
      <div className='lg:hidden'>
        <ClientSidebar />
      </div>
      
      <div className='flex flex-1'>
        <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
          <ClientSidebar />
        </aside>
        
        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {!isBookingFlow && !isConfirmationFlow && (
            <div className="transition-all duration-300 ease-in-out">
              <TopTabs />
            </div>
          )}
          <div className="transition-opacity duration-200">
            <Outlet />
          </div>
        </main>
      </div>
      
      <footer className='bg-footerBackground mt-auto'>
        <Footer />
      </footer>

      {!isConfirmationFlow && (
        <AppointmentWidget 
          businessSlug={businessSlug}
          clientEmail={clientEmail}
        />
      )}

      <ChatWidget 
        businessSlug={businessSlug} 
        apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
      />
    </div>
  )
}

// Business pages wrapper
function BusinessPageLayout() {
  // ✅ Set tab title and favicon to business name and logo
  useBusinessMeta()

  const location = useLocation()
  const { pathname } = location
  const isCalendarPage = pathname.includes('/calendar')

  return (
    <BusinessLayout 
      showBusinessHeader={true}
      sidebar={<BusinessSidebar />}
      footer={<Footer />}
    >
      {!isCalendarPage && <BusinessTopTabs />}
      <Outlet />
    </BusinessLayout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Business Authentication Routes */}
        <Route path="/business/login" element={<LoginPage />} />
        <Route path="/business/signup" element={<SignupPage />} />
        <Route path="/business/onboarding" element={<OnboardingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/business/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/business/reset-password" element={<ResetPasswordPage />} />
        
        {/* Business Dashboard Routes */}
        <Route path="/business" element={<BusinessPageLayout />}>
          <Route index element={<Navigate to="gallery" replace />} />
          <Route path="gallery" element={<BusinessGallery />} />
          <Route path="reviews" element={<BusinessReviewsPage />} />
          <Route path="services" element={<BusinessServicePage />} />
          <Route path="calendar" element={<BusinessCalendar />} />
        </Route>

        {/* Client Routes */}
        <Route path="/:businessSlug" element={<UnifiedClientLayout />}>
          <Route index element={<Navigate to="gallery" replace />} />
          <Route path="gallery" element={<GalleryGrid />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="booking" element={<BookingPage />} />
        </Route>

        {/* Confirmation Page */}
        <Route path="/:businessSlug/confirmation" element={<ConfirmationPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/business/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}