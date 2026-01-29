import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/business/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/account')
};

// ==================== BUSINESS API ====================
export const businessAPI = {
  getBySlug: (slug) => api.get(`/business/${slug}`),
  completeOnboarding: (formData) => {
    return api.put('/business/onboarding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProfile: (formData) => {
    return api.put('/business/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateBookingPolicy: (data) => api.put('/business/booking-policy', data),
  
  // Business Google Calendar
  connectGoogleCalendar: () => api.get('/google-calendar/connect'),
  disconnectGoogleCalendar: () => api.delete('/google-calendar/disconnect'),
  getCalendarStatus: () => api.get('/google-calendar/status'),
  syncBookings: () => api.post('/google-calendar/sync-bookings')
};

// ==================== CLIENT CALENDAR API (NEW) ====================
export const clientCalendarAPI = {
  // Get auth URL for client calendar connection
  getAuthUrl: (clientEmail, bookingId = null) => 
    api.get('/google-calendar/connect-client', { 
      params: { clientEmail, bookingId } 
    }),
  
  // Check if client has connected calendar
  checkStatus: (clientEmail) => 
    api.get('/google-calendar/status-client', { 
      params: { clientEmail } 
    }),
  
  // Disconnect client calendar
  disconnect: (clientEmail) => 
    api.delete('/google-calendar/disconnect-client', { 
      data: { clientEmail } 
    })
};

// ==================== SERVICES API ====================
export const servicesAPI = {
  getByBusinessSlug: (slug) => api.get(`/services/business/${slug}`),
  getMyServices: () => api.get('/services/my-services'),
  create: (formData) => {
    return api.post('/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, formData) => {
    return api.put(`/services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/services/${id}`)
};

// ==================== GALLERY API ====================
export const galleryAPI = {
  getByBusinessSlug: (slug) => api.get(`/gallery/business/${slug}`),
  getMyGallery: () => api.get('/gallery/my-gallery'),
  upload: (formData) => {
    return api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`)
};

// ==================== BOOKINGS API (UPDATED) ====================
export const bookingsAPI = {
  // Create a new booking with optional calendar sync
  create: (data) => api.post('/bookings', data),
  
  // Reschedule booking (NEW)
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getAvailableSlots: (businessSlug, date, params) => 
    api.get(`/bookings/available-slots/${businessSlug}/${date}`, { params }),
  checkAvailability: (data) => api.post('/bookings/check-availability', data),
  cancelBooking: (id, clientEmail) => 
    api.put(`/bookings/${id}/cancel`, { clientEmail }),
  getClientBookings: (clientEmail, params) => 
    api.get(`/bookings/client/${clientEmail}`, { params })
};

// ==================== CHAT API ====================
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (clientEmail) => api.get(`/chat/messages/${clientEmail}`),
  getClientMessages: (businessSlug, clientEmail) => 
    api.get(`/chat/messages/client/${businessSlug}/${clientEmail}`),
  sendMessage: (data) => api.post('/chat/send', data),
  sendClientMessage: (data) => api.post('/chat/send-client', data),
  getUnreadCount: () => api.get('/chat/unread-count')
};

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  getByBusinessSlug: (slug) => api.get(`/reviews/business/${slug}`),
  getMyReviews: (params) => api.get('/reviews/my-reviews', { params }),
  create: (data) => api.post('/reviews', data),
  reply: (id, businessReply) => api.put(`/reviews/${id}/reply`, { businessReply }),
};

// ==================== AUTH HELPERS ====================
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export default api;