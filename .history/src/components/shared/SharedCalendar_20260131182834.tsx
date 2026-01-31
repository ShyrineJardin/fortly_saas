import React, { useState, useEffect } from 'react';
import { IoChevronBack, IoChevronForward, IoCalendarOutline } from 'react-icons/io5';
import BookingDetailsModal from './BookingDetailsModal';

interface Booking {
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
  };
}

interface CalendarProps {
  userRole: 'business' | 'client';
  fetchBookings: () => Promise<Booking[]>;
  onUpdate?: () => void;
  showStats?: boolean;
  allowStatusUpdate?: boolean;
  filterByEmail?: string; // For client view - filter bookings by client email
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Calendar({ 
  userRole, 
  fetchBookings, 
  onUpdate,
  showStats = true,
  allowStatusUpdate = true,
  filterByEmail
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadBookings();
  }, [currentDate]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const data = await fetchBookings();
      
      // Filter by email if provided (for client view)
      let filteredData = data;
      if (filterByEmail) {
        filteredData = data.filter(b => b.clientEmail === filterByEmail);
      }
      
      setBookings(filteredData);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getBookingsForDate = (date: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    
    let filtered = bookings.filter(booking => booking.bookingDate === dateString);
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }
    
    return filtered;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: number) => {
    const today = new Date();
    return (
      date === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primaryGreen border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-textSecondaryColor">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-textPrimaryColor">
              {userRole === 'business' ? 'Bookings Calendar' : 'My Appointments'}
            </h2>
            <p className="text-sm text-textSecondaryColor mt-1">
              {userRole === 'business' 
                ? 'Manage and view all your appointments' 
                : 'View your upcoming and past appointments'}
            </p>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-softGreen text-hoverGreen rounded-lg text-sm font-semibold hover:bg-primaryGreen hover:text-white transition-colors w-full md:w-auto"
          >
            Today
          </button>
        </div>

        {/* Stats - Only show if enabled */}
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4">
            <button
              onClick={() => setFilterStatus('all')}
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === 'all' 
                  ? 'border-primaryGreen bg-softGreen' 
                  : 'border-border hover:border-primaryGreen'
              }`}
            >
              <p className="text-xl md:text-2xl font-bold text-textPrimaryColor">{stats.total}</p>
              <p className="text-xs text-textSecondaryColor">Total</p>
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === 'pending' 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : 'border-border hover:border-yellow-400'
              }`}
            >
              <p className="text-xl md:text-2xl font-bold text-yellow-700">{stats.pending}</p>
              <p className="text-xs text-textSecondaryColor">Pending</p>
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === 'confirmed' 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-border hover:border-green-400'
              }`}
            >
              <p className="text-xl md:text-2xl font-bold text-green-700">{stats.confirmed}</p>
              <p className="text-xs text-textSecondaryColor">Confirmed</p>
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === 'completed' 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-border hover:border-blue-400'
              }`}
            >
              <p className="text-xl md:text-2xl font-bold text-blue-700">{stats.completed}</p>
              <p className="text-xs text-textSecondaryColor">Completed</p>
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`p-3 rounded-lg border transition-all ${
                filterStatus === 'cancelled' 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-border hover:border-red-400'
              }`}
            >
              <p className="text-xl md:text-2xl font-bold text-red-700">{stats.cancelled}</p>
              <p className="text-xs text-textSecondaryColor">Cancelled</p>
            </button>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-softGreen rounded-lg transition-colors"
            >
              <IoChevronBack className="text-xl text-textPrimaryColor" />
            </button>
            <h3 className="text-base md:text-lg font-semibold text-textPrimaryColor min-w-[160px] md:min-w-[200px] text-center">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-softGreen rounded-lg transition-colors"
            >
              <IoChevronForward className="text-xl text-textPrimaryColor" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-softGreen">
          {DAYS.map(day => (
            <div
              key={day}
              className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-hoverGreen border-r border-white last:border-r-0"
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.substring(0, 1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {getDaysInMonth(currentDate).map((day, index) => {
            const dayBookings = day ? getBookingsForDate(day) : [];
            const isCurrentDay = day ? isToday(day) : false;

            return (
              <div
                key={index}
                className={`min-h-[80px] md:min-h-[120px] border-r border-b border-border last:border-r-0 ${
                  !day ? 'bg-gray-50' : 'bg-white hover:bg-softGreen/30 transition-colors'
                } ${isCurrentDay ? 'bg-primaryGreen/10' : ''}`}
              >
                {day && (
                  <>
                    <div className={`p-1 md:p-2 text-xs md:text-sm font-semibold ${
                      isCurrentDay 
                        ? 'text-hoverGreen' 
                        : 'text-textPrimaryColor'
                    }`}>
                      {day}
                      {isCurrentDay && (
                        <span className="ml-1 text-[10px] md:text-xs bg-hoverGreen text-white px-1 md:px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="px-1 md:px-2 pb-1 md:pb-2 space-y-1">
                      {dayBookings.slice(0, 3).map(booking => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`w-full text-left p-1 md:p-1.5 rounded text-[10px] md:text-xs border ${getStatusColor(booking.status)} hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-semibold truncate">{booking.bookingTime.slice(0, 5)}</div>
                          <div className="truncate">
                            {userRole === 'business' ? booking.clientName : booking.Business?.businessName}
                          </div>
                          <div className="truncate text-[9px] md:text-[10px] opacity-75">{booking.Service.title}</div>
                        </button>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] md:text-xs text-textSecondaryColor text-center py-1">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          userRole={userRole}
          onClose={() => setSelectedBooking(null)}
          onUpdate={() => {
            loadBookings();
            if (onUpdate) onUpdate();
          }}
          allowStatusUpdate={allowStatusUpdate}
        />
      )}
    </div>
  );
}