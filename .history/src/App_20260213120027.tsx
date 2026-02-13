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
import ResetPasswordPage from 
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
import ForgotPassword from "./components/business/ForgotPassword"
import ResetPasswordPage from "./pages/business/ResetPasswordPage"

// Unified Client Layout (for gallery, services, reviews, booking)
function UnifiedClientLayout() {
  const location = useLocation()
  const { pathname } = location
  
  // Check if current route is booking or confirmation
  const isBookingFlow = pathname.includes('/booking')
  const isConfirmationFlow = pathname.includes('/confirmation')
  
  // Extract businessSlug from pathname
  const businessSlug = pathname.split('/')[1] || ""
  
  // Get client email from localStorage (same as chat)
  const clientEmail = localStorage.getItem(`chat_${businessSlug}_email`) || ""
  
  // State for mobile actions
  const [mobileAction, setMobileAction] = useState<'chat' | 'appointment' | null>(null)
  
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Mobile Sidebar - STAYS MOUNTED */}
      <div className='lg:hidden'>
        <ClientSidebar />
      </div>
      
      
      <div className='flex flex-1'>
        {/* Desktop Sidebar - STAYS MOUNTED */}
        <aside className='hidden lg:block w-80 p-6 overflow-y-auto'>
          <ClientSidebar />
        </aside>
        
        <main className='flex-1 p-4 lg:p-6 overflow-y-auto'>
          {/* Conditionally render TopTabs with smooth transition */}
          {!isBookingFlow && !isConfirmationFlow && (
            <div className="transition-all duration-300 ease-in-out">
              <TopTabs />
            </div>
          )}
          
          {/* Page content with fade transition */}
          <div className="transition-opacity duration-200">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Footer - STAYS MOUNTED */}
      <footer className='bg-footerBackground mt-auto'>
        <Footer />
      </footer>

      {/* Appointment Widget - Only show when not on confirmation page */}
      {!isConfirmationFlow && (
        <AppointmentWidget 
          businessSlug={businessSlug}
          clientEmail={clientEmail}
        />
      )}

      {/* Chat Widget - STAYS MOUNTED */}
      <ChatWidget 
        businessSlug={businessSlug} 
        apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
      />
    </div>
  )
}

// Business pages wrapper
function BusinessPageLayout() {

  const location = useLocation()
  const { pathname } = location
  
  // Check if current route is calendar
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

        {/* Client Routes - UNIFIED LAYOUT (for main pages) */}
        <Route path="/:businessSlug" element={<UnifiedClientLayout />}>
          <Route index element={<Navigate to="gallery" replace />} />
          <Route path="gallery" element={<GalleryGrid />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="booking" element={<BookingPage />} />
        </Route>

        {/* Confirmation Page - SEPARATE LAYOUT (uses ClientLayout internally) */}
        <Route path="/:businessSlug/confirmation" element={<ConfirmationPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/business/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}