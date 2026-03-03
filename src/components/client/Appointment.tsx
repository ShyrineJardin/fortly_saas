import React, { useState, useEffect } from 'react';
import { FaCalendar, FaClock, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaStickyNote, FaTimes, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaChevronLeft, FaExclamationTriangle } from 'react-icons/fa';
import { HiCalendar } from "react-icons/hi2";
import { bookingsAPI } from '../../utils/api';

// ── Helper: save to localStorage AND notify sibling widgets on the same tab ──
const setLocalStorageWithEvent = (key: string, value: string) => {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('localStorageUpdate', { detail: { key, value } }));
};

// ── Service type badge config ──
const SERVICE_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  appointment: { icon: '📅', label: 'Appointment',        color: 'bg-blue-50 text-blue-700 border-blue-100' },
  preparation: { icon: '🎂', label: 'Preparation / Order', color: 'bg-orange-50 text-orange-700 border-orange-100' },
  occupancy:   { icon: '🏗️', label: 'Occupancy / Rental',  color: 'bg-purple-50 text-purple-700 border-purple-100' },
};

const ServiceTypeBadge = ({ type }: { type?: string }) => {
  if (!type) return null;
  const cfg = SERVICE_TYPE_CONFIG[type];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

interface Booking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;
  notes?: string;
  cancelledBy?: 'client' | 'business';
  cancellationReason?: string;
  Service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    image?: string;
    serviceType?: string;
  };
  Business: {
    businessName: string;
    slug: string;
    logo?: string;
  };
}

interface AppointmentWidgetProps {
  businessSlug: string;
}

const LoadingSpinner = () => (
  <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// ── EmailForm defined OUTSIDE the main component so it never remounts on re-render ──
const EmailForm = ({
  emailInput,
  setEmailInput,
  emailError,
  checkingEmail,
  onSubmit
}: {
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailError: string;
  checkingEmail: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 px-6">
    <div className="bg-primaryGreen bg-opacity-10 p-6 rounded-full mb-4">
      {HiCalendar({ className: "text-primaryGreen", size: 48 })}
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Appointments</h3>
    <p className="text-gray-500 text-sm text-center mb-6">Enter your email address to view your bookings.</p>
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
      <input
        type="email"
        value={emailInput}
        onChange={(e) => setEmailInput(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={checkingEmail}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryGreen text-sm disabled:opacity-50"
      />
      {emailError && <p className="text-xs text-red-600">{emailError}</p>}
      <button
        type="submit"
        disabled={checkingEmail || !emailInput.trim()}
        className="w-full py-3 bg-primaryGreen text-white rounded-lg font-semibold text-sm hover:bg-hoverGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {checkingEmail && <LoadingSpinner />}
        {checkingEmail ? "Searching..." : "View My Appointments"}
      </button>
    </form>
  </div>
);

// ── BookingCard defined OUTSIDE main component for the same reason ──
const BookingCard = ({ booking, onCancelSuccess }: { booking: Booking; onCancelSuccess: () => void; }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';
  const isPast = booking.status === 'completed' || booking.status === 'cancelled';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'pending':   return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">{FaHourglassHalf({size:10})}Pending</span>;
      case 'confirmed': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">{FaCheckCircle({size:10})}Confirmed</span>;
      case 'completed': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">{FaCheckCircle({size:10})}Completed</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">{FaTimesCircle({size:10})}Cancelled</span>;
      default: return null;
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) { setError('Please provide a reason for cancellation'); return; }
    setCancelling(true);
    setError('');
    try {
      await bookingsAPI.cancel(booking.id, { clientEmail: booking.clientEmail, reason: cancelReason, cancelledBy: 'client' });
      setShowCancelModal(false);
      onCancelSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <div className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${isUpcoming ? 'border-primaryGreen' : 'border-gray-200'}`}>
        <div className="relative">
          {booking.Service.image ? (
            <img src={booking.Service.image} alt={booking.Service.name} className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-br from-primaryGreen to-hoverGreen flex items-center justify-center">
              {FaCalendar({className: "text-white text-4xl opacity-50"})}
            </div>
          )}
          <div className="absolute top-3 right-3">{getStatusBadge()}</div>
        </div>

        <div className="p-5">
          <div className="mb-4">
            <ServiceTypeBadge type={booking.Service.serviceType} />
            <h3 className="text-lg font-bold text-gray-900 mb-1 mt-1">{booking.Service.name}</h3>
            <p className="text-sm text-gray-500">{booking.Service.duration} • {booking.Service.price}</p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              {FaCalendar({className: "text-primaryGreen flex-shrink-0", size:14})}
              <span className="font-medium">{formatDate(booking.bookingDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              {FaClock({className: "text-primaryGreen flex-shrink-0", size:14})}
              <span className="font-medium">{formatTime(booking.bookingTime)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">{FaUser({className: "text-gray-400 flex-shrink-0", size:12})}<span>{booking.clientName}</span></div>
            <div className="flex items-center gap-2 text-xs text-gray-600">{FaEnvelope({className: "text-gray-400 flex-shrink-0", size:12})}<span className="truncate">{booking.clientEmail}</span></div>
            {booking.clientPhone && <div className="flex items-center gap-2 text-xs text-gray-600">{FaPhone({className: "text-gray-400 flex-shrink-0", size:12})}<span>{booking.clientPhone}</span></div>}
            {booking.clientAddress && <div className="flex items-start gap-2 text-xs text-gray-600">{FaMapMarkerAlt({className: "text-gray-400 flex-shrink-0 mt-0.5", size:12})}<span className="flex-1">{booking.clientAddress}</span></div>}
          </div>

          {booking.notes && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2 text-xs text-gray-700">{FaStickyNote({className: "text-gray-400 flex-shrink-0 mt-0.5", size:12})}<p className="flex-1 italic">{booking.notes}</p></div>
            </div>
          )}

          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-red-800 mb-1">Cancelled by {booking.cancelledBy === 'client' ? 'You' : booking.Business.businessName}</p>
              <p className="text-xs text-red-700 italic">{booking.cancellationReason}</p>
            </div>
          )}

          {isUpcoming && (
            <button onClick={() => setShowCancelModal(true)} className="w-full py-2.5 bg-red-50 text-red-600 rounded-lg font-medium text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
              {FaTimes({size:14})}Cancel Booking
            </button>
          )}
          {isPast && <div className="text-center py-2 text-xs text-gray-400 font-medium">This booking is {booking.status}</div>}
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slideUp">
            <div className="bg-red-50 border-b border-red-100 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 p-3 rounded-full">{FaExclamationTriangle({className: "text-red-600", size:20})}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Cancel Booking</h3>
                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <button onClick={() => setShowCancelModal(false)} disabled={cancelling} className="p-1 hover:bg-red-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {FaTimes({className: "text-gray-500", size:18})}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">Are you sure you want to cancel this appointment?</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                  <ServiceTypeBadge type={booking.Service.serviceType} />
                  <p className="font-semibold text-gray-900 mb-1 mt-1">{booking.Service.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-600">{FaCalendar({size:10})}<span>{formatDate(booking.bookingDate)}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">{FaClock({size:10})}<span>{formatTime(booking.bookingTime)}</span></div>
                </div>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">{FaExclamationTriangle({className: "text-red-600 flex-shrink-0 mt-0.5", size:14})}<p className="text-red-700 text-sm">{error}</p></div>}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for cancellation <span className="text-red-500">*</span></label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Please let us know why you're cancelling..." rows={3} disabled={cancelling} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50" required />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelModal(false)} disabled={cancelling} className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Keep Booking</button>
                <button onClick={handleCancelBooking} disabled={cancelling || !cancelReason.trim()} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/30">
                  {cancelling && <LoadingSpinner />}{cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ── EmptyState also outside to be safe ──
const EmptyState = ({ tab }: { tab: string }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="bg-gray-100 p-6 rounded-full mb-4">{HiCalendar({className: "text-gray-400", size:48})}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No {tab} appointments</h3>
    <p className="text-gray-500 text-sm text-center max-w-sm">
      {tab === 'upcoming' ? "You don't have any upcoming appointments scheduled yet." : "You don't have any past appointments."}
    </p>
  </div>
);

// ==================== MAIN APPOINTMENT WIDGET ====================
export default function AppointmentWidget({ businessSlug }: AppointmentWidgetProps) {

  const resolveStoredEmail = () =>
    localStorage.getItem(`appointment_${businessSlug}_email`) ||
    localStorage.getItem(`chat_${businessSlug}_email`) ||
    localStorage.getItem(`booking_${businessSlug}_email`) ||
    "";

  const [clientEmail, setClientEmail] = useState(() => resolveStoredEmail());
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const email = resolveStoredEmail();
      if (email) {
        setClientEmail(email);
        loadBookings(email);
      } else {
        setShowEmailForm(true);
      }
    }
  }, [isOpen, businessSlug]);

  useEffect(() => {
    const handleOpenAppointment = () => setIsOpen(true);
    window.addEventListener('openAppointment', handleOpenAppointment);

    const handleLocalStorageUpdate = (e: CustomEvent) => {
      const relevantKeys = [
        `chat_${businessSlug}_email`,
        `booking_${businessSlug}_email`,
        `appointment_${businessSlug}_email`
      ];
      if (relevantKeys.includes(e.detail.key) && !clientEmail) {
        const newEmail = resolveStoredEmail();
        if (newEmail) {
          setClientEmail(newEmail);
          setShowEmailForm(false);
        }
      }
    };
    window.addEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);

    return () => {
      window.removeEventListener('openAppointment', handleOpenAppointment);
      window.removeEventListener('localStorageUpdate', handleLocalStorageUpdate as EventListener);
    };
  }, [businessSlug, clientEmail]);

  const loadBookings = async (emailOverride?: string) => {
    const email = emailOverride || clientEmail;
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const response = await bookingsAPI.getClientBookings(email, { businessSlug });
      setBookings(response.data.bookings || []);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setCheckingEmail(true);
    try {
      const response = await bookingsAPI.getClientBookings(emailInput.trim(), { businessSlug });
      const found = response.data.bookings || [];
      if (found.length > 0) {
        setLocalStorageWithEvent(`appointment_${businessSlug}_email`, emailInput.trim());
        setClientEmail(emailInput.trim());
        setShowEmailForm(false);
        setBookings(found);
      } else {
        setEmailError("No bookings found for this email.");
      }
    } catch {
      setEmailError("No bookings found for this email.");
    } finally {
      setCheckingEmail(false);
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed')
    .sort((a, b) => new Date(`${a.bookingDate}T${a.bookingTime}`).getTime() - new Date(`${b.bookingDate}T${b.bookingTime}`).getTime());

  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled')
    .sort((a, b) => new Date(`${b.bookingDate}T${b.bookingTime}`).getTime() - new Date(`${a.bookingDate}T${a.bookingTime}`).getTime());

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <>
      {/* DESKTOP FLOATING BUTTON */}
      <div className="hidden lg:block fixed bottom-28 right-6 z-50">
        <button onClick={() => setIsOpen(true)} className="bg-white border-2 border-primaryGreen text-primaryGreen p-4 rounded-full shadow-lg hover:bg-primaryGreen hover:text-white transition-all duration-300" title="View Appointments">
          {HiCalendar({size:24})}
        </button>
      </div>

      {/* DESKTOP MODAL */}
      {isOpen && (
        <div className="hidden lg:block">
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-primaryGreen bg-opacity-10 p-3 rounded-full">{HiCalendar({className: "text-primaryGreen", size:24})}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
                    <p className="text-sm text-gray-500">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} total</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">{FaTimes({className: "text-gray-500", size:20})}</button>
              </div>

              {!showEmailForm && (
                <div className="flex border-b border-gray-200 px-6">
                  {(['upcoming', 'past'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-primaryGreen text-primaryGreen' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'upcoming' ? upcomingBookings.length : pastBookings.length})
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6">
                {showEmailForm && (
                  <EmailForm
                    emailInput={emailInput}
                    setEmailInput={setEmailInput}
                    emailError={emailError}
                    checkingEmail={checkingEmail}
                    onSubmit={handleEmailSubmit}
                  />
                )}
                {!showEmailForm && loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500">Loading your appointments...</p>
                  </div>
                )}
                {!showEmailForm && error && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-red-500 mb-4">{FaTimes({size:48})}</div>
                    <p className="text-gray-700 font-medium mb-2">{error}</p>
                    <button onClick={() => loadBookings()} className="text-primaryGreen hover:text-hoverGreen font-medium text-sm">Try again</button>
                  </div>
                )}
                {!showEmailForm && !loading && !error && displayedBookings.length === 0 && (
                  <EmptyState tab={activeTab} />
                )}
                {!showEmailForm && displayedBookings.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedBookings.map(booking => <BookingCard key={booking.id} booking={booking} onCancelSuccess={() => loadBookings()} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE FULLSCREEN */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsOpen(false)} className="p-2 -ml-2">{FaChevronLeft({size:20})}</button>
              <div className="flex items-center gap-2">
                {HiCalendar({className: "text-primaryGreen", size:20})}
                <div>
                  <h2 className="font-bold text-base">My Appointments</h2>
                  <p className="text-xs text-gray-500">{bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}</p>
                </div>
              </div>
            </div>
          </div>

          {!showEmailForm && (
            <div className="flex border-b border-gray-200 bg-white sticky top-[57px] z-10">
              {(['upcoming', 'past'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-primaryGreen text-primaryGreen' : 'border-transparent text-gray-500'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'upcoming' ? upcomingBookings.length : pastBookings.length})
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {showEmailForm && (
              <EmailForm
                emailInput={emailInput}
                setEmailInput={setEmailInput}
                emailError={emailError}
                checkingEmail={checkingEmail}
                onSubmit={handleEmailSubmit}
              />
            )}
            {!showEmailForm && loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Loading your appointments...</p>
              </div>
            )}
            {!showEmailForm && error && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 mb-4">{FaTimes({size:48})}</div>
                <p className="text-gray-700 font-medium mb-2">{error}</p>
                <button onClick={() => loadBookings()} className="text-primaryGreen hover:text-hoverGreen font-medium text-sm">Try again</button>
              </div>
            )}
            {!showEmailForm && !loading && !error && displayedBookings.length === 0 && (
              <EmptyState tab={activeTab} />
            )}
            {!showEmailForm && displayedBookings.length > 0 && (
              <div className="space-y-4">
                {displayedBookings.map(booking => <BookingCard key={booking.id} booking={booking} onCancelSuccess={() => loadBookings()} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}