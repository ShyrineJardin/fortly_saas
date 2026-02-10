import React from 'react';
import { IoClose, IoChatbubbleEllipsesOutline, IoCalendarOutline, IoTimeOutline, IoPersonOutline, IoMailOutline, IoCallOutline, IoLocationOutline } from 'react-icons/io5';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateHelpers';

export default function BookingDetailsModal({ booking, onClose, onChat, onUpdateStatus }) {
  if (!booking) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = (newStatus) => {
    if (window.confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) {
      onUpdateStatus(booking.id, newStatus);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {IoClose({size: 28})}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
            {booking.hasChatHistory && (
              <button
                onClick={() => onChat(booking.clientEmail)}
                className="flex items-center gap-2 px-4 py-2 bg-softGreen text-hoverGreen rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
              >
                {IoChatbubbleEllipsesOutline({size: 18})}
                <span>Open Chat</span>
              </button>
            )}
          </div>

          {/* Service Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Service</h3>
            <div className="flex items-start gap-4">
              {booking.Service?.image && (
                <img 
                  src={`http://localhost:5000${booking.Service.image}`}
                  alt={booking.Service.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900">{booking.Service?.name || 'Service'}</h4>
                {booking.Service?.description && (
                  <p className="text-sm text-gray-600 mt-1">{booking.Service.description}</p>
                )}
                {booking.Service?.duration && (
                  <p className="text-sm text-gray-500 mt-2">Duration: {booking.Service.duration} minutes</p>
                )}
                {booking.Service?.price && (
                  <p className="text-lg font-bold text-hoverGreen mt-2">${booking.Service.price}</p>
                )}
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-softGreen rounded-lg flex items-center justify-center flex-shrink-0">
                {IoCalendarOutline({size: 20, className: "text-hoverGreen"})}
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="text-base font-semibold text-gray-900">{formatDate(booking.bookingDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-softGreen rounded-lg flex items-center justify-center flex-shrink-0">
                {IoTimeOutline({size: 20, className: "text-hoverGreen"})}
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-base font-semibold text-gray-900">{formatTime(booking.bookingTime)}</p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Client Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {IoPersonOutline({size: 20, className: "text-gray-400"})}
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-base font-semibold text-gray-900">{booking.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {IoMailOutline({size: 20, className: "text-gray-400"})}
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a 
                    href={`mailto:${booking.clientEmail}`}
                    className="text-base font-semibold text-hoverGreen hover:underline"
                  >
                    {booking.clientEmail}
                  </a>
                </div>
              </div>
              {booking.clientPhone && (
                <div className="flex items-center gap-3">
                  <IoCallOutline size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a 
                      href={`tel:${booking.clientPhone}`}
                      className="text-base font-semibold text-hoverGreen hover:underline"
                    >
                      {booking.clientPhone}
                    </a>
                  </div>
                </div>
              )}
              {booking.clientAddress && (
                <div className="flex items-start gap-3">
                  <IoLocationOutline size={20} className="text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-base font-semibold text-gray-900">{booking.clientAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Client Notes</h3>
              <p className="text-sm text-blue-800">{booking.notes}</p>
            </div>
          )}

          {/* Cancellation Info */}
          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <h3 className="text-sm font-semibold text-red-900 mb-2">Cancellation Details</h3>
              <p className="text-sm text-red-800 mb-1">
                <span className="font-semibold">Cancelled by:</span> {booking.cancelledBy}
              </p>
              <p className="text-sm text-red-800">
                <span className="font-semibold">Reason:</span> {booking.cancellationReason}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
              {booking.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Confirm Booking
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Mark as Completed
                </button>
              )}
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            <p>Booking ID: {booking.id}</p>
            <p>Created: {new Date(booking.createdAt).toLocaleString()}</p>
            {booking.updatedAt && (
              <p>Last Updated: {new Date(booking.updatedAt).toLocaleString()}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}