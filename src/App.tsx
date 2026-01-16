import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import GalleryPage from "./pages/client/GalleryPage"
import ServicesPage from "./pages/client/ServicesPage"
import ReviewsPage from "./pages/client/ReviewsPage"
import BookingPage from "./pages/client/BookingPage"
import ConfirmationPage from "./pages/client/ConfirmationPage"
import Chat from "./components/client/Chat"

import LoginPage from './pages/business/LoginPage'
import SignupPage from './pages/business/SignupPage'
import OnboardingPage from './pages/business/OnboardingPage'
import BusinessGalleryPage from './pages/business/BusinessGalleryPage'
import BusinessReviewsPage from "./pages/business/BusinessReviewsPage"
import BusinessServicePage from "./pages/business/BusinessServicePage"
import BusinessChat from "./components/business/BusinessChat"


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/chat" element={<Chat />} />

        {/* Business Routes */}
        <Route path="/business/login" element={<LoginPage />} />
        <Route path="/business/signup" element={<SignupPage />} />
        <Route path="/business/onboarding" element={<OnboardingPage />} />
        <Route path="/business" element={<Navigate to="/business/login" replace />} />
        <Route path="/business/gallery" element={<BusinessGalleryPage />} />
        <Route path="/business/reviews" element={<BusinessReviewsPage />} />
        <Route path="/business/services" element={<BusinessServicePage />} />
        <Route path="/business/chat" element={<BusinessChat />} />


      </Routes>
    </BrowserRouter>
  )
}