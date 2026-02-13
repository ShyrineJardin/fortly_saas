import React, { useState } from 'react';
import { IoClose, IoChatbubbleEllipsesOutline, IoCalendarOutline, IoTimeOutline, IoPersonOutline, IoMailOutline, IoCallOutline, IoLocationOutline, IoWarning, IoCheckmarkCircle } from 'react-icons/io5';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateHelpers';

export default function BookingDetailsModal({ booking, onClose, onChat, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false);
  const [actionType, setActionType] = useState(null); // 'confirm', 'complete', 'cancel'
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{status: string, action: string} | null>(null);

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

   const handleStatusChange = (newStatus, action) => {
    setPendingAction({ status: newStatus, action });
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingAction) return;

    setUpdating(true);
    setActionType(pendingAction.action);
    try {
      await onUpdateStatus(booking.id, pendingAction.status);
      setShowConfirmModal(false);
      setPendingAction(null);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdating(false);
      setActionType(null);
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  const getConfirmModalConfig = () => {
    if (!pendingAction) return null;

    switch (pendingAction.action) {
      case 'confirm':
        return {
          icon: IoCheckmarkCircle,
          iconColor: 'text-green-600',
          iconBg: 'bg-green-100',
          headerBg: 'bg-green-50',
          borderColor: 'border-green-100',
          title: 'Confirm Booking',
          message: 'Are you sure you want to confirm this booking?',
          buttonColor: 'bg-green-600 hover:bg-green-700 shadow-green-600/30',
          buttonText: 'Yes, Confirm',
        };
      case 'complete':
        return {
          icon: IoCheckmarkCircle,
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          headerBg: 'bg-blue-50',
          borderColor: 'border-blue-100',
          title: 'Mark as Completed',
          message: 'Are you sure this booking has been completed?',
          buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
          buttonText: 'Yes, Complete',
        };
      case 'cancel':
        return {
          icon: IoWarning,
          iconColor: 'text-red-600',
          iconBg: 'bg-red-100',
          headerBg: 'bg-red-50',
          borderColor: 'border-red-100',
          title: 'Cancel Booking',
          message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
          buttonColor: 'bg-red-600 hover:bg-red-700 shadow-red-600/30',
          buttonText: 'Yes, Cancel',
        };
      default:
        return null;
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const modalConfig = getConfirmModalConfig();

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
              disabled={updating}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2 bg-softGreen text-hoverGreen rounded-lg hover:bg-green-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {IoCallOutline({size: 20, className: "text-gray-400"})}
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
                  {IoLocationOutline({size: 20, className: "text-gray-400 mt-1"})}
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
                  onClick={() => handleStatusChange('confirmed', 'confirm')}
                  disabled={updating}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating && actionType === 'confirm' && <LoadingSpinner />}
                  {updating && actionType === 'confirm' ? 'Confirming...' : 'Confirm Booking'}
                </button>
              )}
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('completed', 'complete')}
                  disabled={updating}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {updating && actionType === 'complete' && <LoadingSpinner />}
                  {updating && actionType === 'complete' ? 'Completing...' : 'Mark as Completed'}
                </button>
              )}
              <button
                onClick={() => handleStatusChange('cancelled', 'cancel')}
                disabled={updating}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating && actionType === 'cancel' && <LoadingSpinner />}
                {updating && actionType === 'cancel' ? 'Cancelling...' : 'Cancel Booking'}
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