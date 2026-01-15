import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import GalleryPage from "./pages/client/GalleryPage"
import ServicesPage from "./pages/client/ServicesPage"
import ReviewsPage from "./pages/client/ReviewsPage"
import BookingPage from "./pages/client/BookingPage"
import ConfirmationPage from "./pages/client/ConfirmationPage"
import Chat from "./components/client/Chat"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/gallery" replace />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  )
}