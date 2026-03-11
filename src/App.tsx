import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import GalleryGrid from "./components/client/GalleryGrid"
import ServicesPage from "./pages/client/ServicesPage"
import ReviewsPage from "./pages/client/ReviewsPage"
import BookingPage from "./pages/client/BookingPage"
import ConfirmationPage from "./pages/client/ConfirmationPage"
import { preloadNotificationSound } from "./utils/notificationSound"
import NotFoundPage from './pages/NotFoundPage'

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

import ClientSidebar from "./components/client/ClientSidebar"
import Footer from "./components/client/Footer"
import TopTabs from "./components/client/TopTabs"
import ChatWidget from "./components/client/Chat"
import AppointmentWidget from "./components/client/Appointment"
import BusinessLayout from "./components/layout/BusinessLayout"
import BusinessSidebar from "./components/business/BusinessSidebar"
import BusinessTopTabs from "./components/business/BusinessTopTabs"

import { useBusinessMeta, useClientBusinessMeta } from "./hooks/useBusinessMeta"
import { authAPI, businessAPI } from "./utils/api"

// Admin imports
import AdminRoute from './pages/admin/AdminRoute';
import AdminLogin from './components/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import BusinessesList from './components/admin/BusinessesList';
import BusinessDetail from './components/admin/BusinessDetail';

// ─────────────────────────────────────────────────────────────────────────────
// PAUSED SCREEN — shown to business owner when their account is paused
// ─────────────────────────────────────────────────────────────────────────────
function BusinessPausedScreen({ reason }: { reason?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Paused</h1>
        <p className="text-gray-500 mb-4">
          Your account has been temporarily paused by an administrator.
        </p>
        {reason && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6 text-sm text-orange-800">
            <strong>Reason:</strong> {reason}
          </div>
        )}
        <p className="text-sm text-gray-400 mb-6">
          Please contact support at <a href="mailto:support@fortly.xyz" className="text-emerald-600 underline">support@fortly.xyz</a> to resolve this.
        </p>
        <button
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/business/login'; }}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAUSED SCREEN — shown to clients visiting a paused business's public page
// ─────────────────────────────────────────────────────────────────────────────
function ClientPausedScreen({ businessName, logo }: { businessName?: string; logo?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {logo ? (
          <img src={logo} alt={businessName} className="w-16 h-16 rounded-full object-cover mx-auto mb-4" />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-gray-500">
              {businessName?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {businessName || 'This Business'}
        </h1>
        <p className="text-gray-500 mb-2">is temporarily unavailable.</p>
        <p className="text-sm text-gray-400">
          Please check back later or contact the business directly.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED CLIENT LAYOUT — checks isPaused from the public API response
// ─────────────────────────────────────────────────────────────────────────────
function UnifiedClientLayout() {
  const location = useLocation()
  const { pathname } = location
  const { businessSlug } = useParams()

  const [pausedInfo, setPausedInfo] = useState<{ isPaused: boolean; businessName?: string; logo?: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useClientBusinessMeta(businessSlug)

  useEffect(() => {
    if (!businessSlug) { setChecking(false); return; }

    businessAPI.getBySlug(businessSlug)
      .then(() => { setPausedInfo(null); setChecking(false); })
      .catch((err: any) => {
        if (err.response?.status === 403 && err.response?.data?.isPaused) {
          setPausedInfo({
            isPaused: true,
            businessName: err.response.data.business?.businessName,
            logo: err.response.data.business?.logo
          });
        } else if (err.response?.status === 404) {
          // redirect to 404
          window.location.replace('/404');
        }
        setChecking(false);
      });
  }, [businessSlug]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  // ── Client sees "unavailable" screen if business is paused ──
  if (pausedInfo?.isPaused) {
    return <ClientPausedScreen businessName={pausedInfo.businessName} logo={pausedInfo.logo} />;
  }

  const isBookingFlow = pathname.includes('/booking')
  const isConfirmationFlow = pathname.includes('/confirmation')

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
        <AppointmentWidget businessSlug={businessSlug || ""} />
      )}

      <ChatWidget
        businessSlug={businessSlug || ""}
        apiBaseUrl={process.env.REACT_APP_API_URL || "http://localhost:5000/api"}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS PAGE LAYOUT — checks isPaused from /me on every load
// ─────────────────────────────────────────────────────────────────────────────
function BusinessPageLayout() {
  useBusinessMeta()

  const location = useLocation()
  const { pathname } = location
  const isCalendarPage = pathname.includes('/calendar')

  const [pausedInfo, setPausedInfo] = useState<{ isPaused: boolean; reason?: string } | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    authAPI.getMe()
      .then((res: any) => {
        const biz = res.data.business;
        if (biz?.isPaused) {
          setPausedInfo({ isPaused: true, reason: biz.pauseReason });
        } else {
          setPausedInfo(null);
        }
        setChecking(false);
      })
      .catch((err: any) => {
        // 403 with isPaused means the middleware blocked it
        if (err.response?.status === 403 && err.response?.data?.isPaused) {
          setPausedInfo({ isPaused: true, reason: err.response.data.pauseReason });
        }
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  // ── Business owner sees paused screen instead of dashboard ──
  if (pausedInfo?.isPaused) {
    return <BusinessPausedScreen reason={pausedInfo.reason} />;
  }

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

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  useEffect(() => {
    preloadNotificationSound().catch(error => {
      console.warn('Failed to preload notification sound:', error);
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Business Auth */}
        <Route path="/business/login" element={<LoginPage />} />
        <Route path="/business/signup" element={<SignupPage />} />
        <Route path="/business/onboarding" element={<OnboardingPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/business/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/business/reset-password" element={<ResetPasswordPage />} />

        {/* Business Dashboard */}
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

        {/* Confirmation */}
        <Route path="/:businessSlug/confirmation" element={<ConfirmationPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="businesses" element={<BusinessesList />} />
            <Route path="businesses/:id" element={<BusinessDetail />} />
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/business/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}