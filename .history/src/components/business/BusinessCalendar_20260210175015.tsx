import React, { useState, useEffect } from 'react';
import { IoChevronBack, IoChevronForward, IoCalendarOutline, IoFilter, IoSearchOutline, IoChatbubbleEllipsesOutline, IoTimeOutline } from 'react-icons/io5';
import { bookingsAPI } from '../../utils/api';
import BookingDetailsModal from './BookingDetailsModal';
import { 
  getMonthName, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  isToday, 
  isSameDay,
  formatDate,
  formatTime,
  getWeekDays
} from '../../utils/dateHelpers';

export default function BusinessCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.clientName.toLowerCase().includes(term) ||
        b.clientEmail.toLowerCase().includes(term) ||
        b.Service?.name.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getBookingsForDate = (date) => {
    return filteredBookings.filter(booking => 
      isSameDay(booking.bookingDate, date)
    );
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await bookingsAPI.updateStatus(bookingId, newStatus);
      await fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const handleChatClick = (clientEmail) => {
    setSelectedBooking(null);
    window.dispatchEvent(new CustomEvent('openChat', { detail: { clientEmail } }));
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-[100px] lg:min-h-[120px]" />
      );
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBookings = getBookingsForDate(date);
      const isCurrentDay = isToday(date);

      days.push(
        <div
          key={day}
          className={`p-2 min-h-[100px] lg:min-h-[120px] border border-gray-100 transition-colors ${
            isCurrentDay ? 'bg-softGreen border-hoverGreen' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-semibold mb-2 ${
            isCurrentDay ? 'text-hoverGreen' : 'text-gray-700'
          }`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayBookings.slice(0, 3).map(booking => (
              <button
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`w-full text-left p-1.5 rounded text-xs transition-colors ${
                  booking.status === 'confirmed' ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' :
                  booking.status === 'completed' ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' :
                  'bg-red-100 hover:bg-red-200 text-red-800'
                }`}
              >
                <div className="font-semibold truncate">{formatTime(booking.bookingTime)}</div>
                <div className="truncate">{booking.clientName}</div>
              </button>
            ))}
            {dayBookings.length > 3 && (
              <div className="text-xs text-gray-500 pl-1.5">
                +{dayBookings.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const renderListView = () => {
    const sortedBookings = [...filteredBookings].sort((a, b) => {
      const dateA = new Date(`${a.bookingDate} ${a.bookingTime}`);
      const dateB = new Date(`${b.bookingDate} ${b.bookingTime}`);
      return dateA.getTime() - dateB.getTime();
    });

    if (sortedBookings.length === 0) {
      return (
        <div className="text-center py-12">
          {IoCalendarOutline({size: 48, className: "mx-auto text-gray-300 mb-4"})}
          <p className="text-gray-500">No bookings found</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedBookings.map(booking => (
          <button
            key={booking.id}
            onClick={() => setSelectedBooking(booking)}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  {booking.hasChatHistory && (
                    <span className="text-hoverGreen text-xs flex items-center gap-1">
                      {IoChatbubbleEllipsesOutline({size: 14})}
                      Chat
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{booking.clientName}</h3>
                <p className="text-sm text-gray-600 mb-2">{booking.Service?.name}</p>
                <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    {IoCalendarOutline({size: 16})}
                    {formatDate(booking.bookingDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    {IoTimeOutline({size: 16})}
                    {formatTime(booking.bookingTime)}
                  </span>
                </div>
              </div>
              {booking.Service?.image && (
                <img 
                  src={`http://localhost:5000${booking.Service.image}`}
                  alt={booking.Service.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hoverGreen"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div>
        <button
            onClick={handlePreviousMonth}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            {IoChevronBack({size: 20, className: "text-gray-600"})}
          </button>

      </div>
      <div className="bg-gradient-to-r from-softGreen to-white border-b border-gray-100 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title and Navigation */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Calendar</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                {IoChevronBack({size: 20, className: "text-gray-600"})}
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                {IoChevronForward({size: 20, className: "text-gray-600"})}
              </button>
            </div>
          </div>

          {/* Month/Year Display */}
          <div className="text-center lg:text-left">
            <h3 className="text-lg font-semibold text-gray-800">
              {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
            </h3>
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-hoverGreen text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-hoverGreen text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            {IoSearchOutline({className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 20})}
            <input
              type="text"
              placeholder="Search by client name, email, or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hoverGreen"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            {IoFilter({className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", size: 20})}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hoverGreen appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">{filteredBookings.length}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-600">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Confirmed</p>
            <p className="text-xl font-bold text-green-600">
              {filteredBookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-xl font-bold text-blue-600">
              {filteredBookings.filter(b => b.status === 'completed').length}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-4 lg:p-6">
        {viewMode === 'month' ? (
          <>
            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {getWeekDays().map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {renderCalendarGrid()}
            </div>
          </>
        ) : (
          renderListView()
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onChat={handleChatClick}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}