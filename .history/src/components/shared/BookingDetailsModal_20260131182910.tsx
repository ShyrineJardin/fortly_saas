import React, { useState } from 'react';
import { IoClose, IoPersonOutline, IoMailOutline, IoCallOutline, IoLocationOutline, IoTimeOutline, IoCalendarOutline, IoChatbubbleOutline, IoCheckmarkCircle, IoCloseCircle, IoAlertCircle, IoBusinessOutline } from 'react-icons/io5';
import ChatPanel from './ChatPanel';

interface BookingDetailsModalProps {
  booking: {
    id: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    bookingDate: string;
    bookingTime: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    notes?: string;
    hasChatHistory: boolean;
    lastChatMessageAt?: string;
    Service: {
      id: string;
      title: string;
      duration: string;
      price: number;
    };
    Business?: {
      id: string;
      businessName: string;
      slug: string;
      logo?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
  };
  userRole: 'business' | 'client';
  onClose: () => void;
  onUpdate: () => void;
  allowStatusUpdate?: boolean;
  onStatusUpdate?: (bookingId: string, newStatus: string) => Promise<void>;
}

export default function BookingDetailsModal({ 
  booking, 
  userRole, 
  onClose, 
  onUpdate,
  allowStatusUpdate = true,
  onStatusUpdate
}: BookingDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'chat'>('details');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleStatusUpdate = async (newStatus: string) => {
    const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    if (window.confirm(`Are you sure you want to mark this booking as ${statusText}?`)) {
      try {
        setIsUpdating(true);
        if (onStatusUpdate) {
          await onStatusUpdate(booking.id, newStatus);
        }
        onUpdate();
        onClose();
      } catch (error) {
        console.error('Error updating booking status:', error);
        alert('Failed to update booking status. Please try again.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      confirmed: {
        icon: IoCheckmarkCircle,
        text: 'Confirmed',
        className: 'bg-green-100 text-green-700 border border-green-300'
      },
      pending: {
        icon: IoAlertCircle,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-700 border border-yellow-300'
      },
      completed: {
        icon: IoCheckmarkCircle,
        text: 'Completed',
        className: 'bg-blue-100 text-blue-700 border border-blue-300'
      },
      cancelled: {
        icon: IoCloseCircle,
        text: 'Cancelled',
        className: 'bg-red-100 text-red-700 border border-red-300'
      }
    };

    const config = configs[status as keyof typeof configs];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.className}`}>
        <Icon className="text-lg" />
        {config.text}
      </div>
    );
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-4xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-textPrimaryColor mb-2">
                {userRole === 'business' ? 'Booking Details' : 'Appointment Details'}
              </h2>
              {getStatusBadge(booking.status)}
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-3xl ml-4"
            >
              <IoClose />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-2 px-1 font-semibold transition-colors ${
                activeTab === 'details'
                  ? 'text-hoverGreen border-b-2 border-hoverGreen'
                  : 'text-textSecondaryColor hover:text-hoverGreen'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`pb-2 px-1 font-semibold transition-colors relative ${
                activeTab === 'chat'
                  ? 'text-hoverGreen border-b-2 border-hoverGreen'
                  : 'text-textSecondaryColor hover:text-hoverGreen'
              }`}
            >
              Chat
              {booking.hasChatHistory && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-hoverGreen rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeTab === 'details' ? (
            <div className="space-y-4 md:space-y-6">
              {/* Service Information */}
              <div className="bg-softGreen p-4 rounded-xl">
                <h3 className="text-sm font-semibold text-textSecondaryColor mb-2">Service</h3>
                <p className="text-lg font-bold text-textPrimaryColor">{booking.Service.title}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-textSecondaryColor">
                  <span>Duration: {booking.Service.duration}</span>
                  <span>•</span>
                  <span>Price: ${booking.Service.price}</span>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 border border-border rounded-xl">
                  <IoCalendarOutline className="text-2xl text-hoverGreen mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondaryColor mb-1">Date</h4>
                    <p className="text-textPrimaryColor font-semibold">{formatDate(booking.bookingDate)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-border rounded-xl">
                  <IoTimeOutline className="text-2xl text-hoverGreen mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-textSecondaryColor mb-1">Time</h4>
                    <p className="text-textPrimaryColor font-semibold">{formatTime(booking.bookingTime)}</p>
                  </div>
                </div>
              </div>

              {/* Business or Client Information */}
              {userRole === 'client' && booking.Business ? (
                // Show business info for clients
                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-lg font-bold text-textPrimaryColor mb-4">Business Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {booking.Business.logo ? (
                        <img 
                          src={`http://localhost:5000${booking.Business.logo}`}
                          alt={booking.Business.businessName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primaryGreen flex items-center justify-center text-white font-bold text-lg">
                          {booking.Business.businessName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-textSecondaryColor">Business Name</p>
                        <p className="text-textPrimaryColor font-semibold">{booking.Business.businessName}</p>
                      </div>
                    </div>
                    {booking.Business.email && (
                      <div className="flex items-center gap-3">
                        <IoMailOutline className="text-xl text-hoverGreen" />
                        <div>
                          <p className="text-xs text-textSecondaryColor">Email</p>
                          <a 
                            href={`mailto:${booking.Business.email}`}
                            className="text-hoverGreen font-semibold hover:underline"
                          >
                            {booking.Business.email}
                          </a>
                        </div>
                      </div>
                    )}
                    {booking.Business.phone && (
                      <div className="flex items-center gap-3">
                        <IoCallOutline className="text-xl text-hoverGreen" />
                        <div>
                          <p className="text-xs text-textSecondaryColor">Phone</p>
                          <a 
                            href={`tel:${booking.Business.phone}`}
                            className="text-textPrimaryColor font-semibold hover:text-hoverGreen"
                          >
                            {booking.Business.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {booking.Business.location && (
                      <div className="flex items-start gap-3">
                        <IoLocationOutline className="text-xl text-hoverGreen mt-0.5" />
                        <div>
                          <p className="text-xs text-textSecondaryColor">Location</p>
                          <p className="text-textPrimaryColor">{booking.Business.location}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Show client info for businesses
                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-lg font-bold text-textPrimaryColor mb-4">Client Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <IoPersonOutline className="text-xl text-hoverGreen" />
                      <div>
                        <p className="text-xs text-textSecondaryColor">Name</p>
                        <p className="text-textPrimaryColor font-semibold">{booking.clientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <IoMailOutline className="text-xl text-hoverGreen" />
                      <div>
                        <p className="text-xs text-textSecondaryColor">Email</p>
                        <a 
                          href={`mailto:${booking.clientEmail}`}
                          className="text-hoverGreen font-semibold hover:underline"
                        >
                          {booking.clientEmail}
                        </a>
                      </div>
                    </div>
                    {booking.clientPhone && (
                      <div className="flex items-center gap-3">
                        <IoCallOutline className="text-xl text-hoverGreen" />
                        <div>
                          <p className="text-xs text-textSecondaryColor">Phone</p>
                          <a 
                            href={`tel:${booking.clientPhone}`}
                            className="text-textPrimaryColor font-semibold hover:text-hoverGreen"
                          >
                            {booking.clientPhone}
                          </a>
                        </div>
                      </div>
                    )}
                    {booking.clientAddress && (
                      <div className="flex items-start gap-3">
                        <IoLocationOutline className="text-xl text-hoverGreen mt-0.5" />
                        <div>
                          <p className="text-xs text-textSecondaryColor">Address</p>
                          <p className="text-textPrimaryColor">{booking.clientAddress}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="border border-border rounded-xl p-4">
                  <h3 className="text-lg font-bold text-textPrimaryColor mb-2">Notes</h3>
                  <p className="text-textSecondaryColor">{booking.notes}</p>
                </div>
              )}

              {/* Action Buttons - Only for business */}
              {userRole === 'business' && allowStatusUpdate && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <div className="flex flex-wrap gap-3">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate('confirmed')}
                      disabled={isUpdating}
                      className="flex-1 min-w-[150px] bg-green-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Confirm Booking'}
                    </button>
                  )}
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={isUpdating}
                      className="flex-1 min-w-[150px] bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark as Completed'}
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isUpdating}
                    className="flex-1 min-w-[150px] bg-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ChatPanel 
              clientEmail={booking.clientEmail} 
              clientName={booking.clientName}
              userRole={userRole}
              businessEmail={booking.Business?.email}
              businessName={booking.Business?.businessName}
            />
          )}
        </div>
      </div>
    </>
  );
}