import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Authenticated instance — for business dashboard routes only ──
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/business/login';
    }
    // ── 403 isPaused: do NOT redirect — let the caller handle it ──
    return Promise.reject(error);
  }
);

// ── Public (unauthenticated) instance — for client-facing routes ──
// Never sends a business token so the backend always sees the real
// public request and can return 403 isPaused correctly.
const publicApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

publicApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error) // caller handles 403 isPaused
);

// ==================== AUTH API ====================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  deleteAccount: () => api.delete('/auth/account'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// ==================== BUSINESS API ====================
export const businessAPI = {
  // ── Public: use publicApi so no token is sent and isPaused is enforced ──
  getBySlug: (slug) => publicApi.get(`/business/${slug}`),

  completeOnboarding: (formData) =>
    api.put('/business/onboarding', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateProfile: (formData) =>
    api.put('/business/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  updateBookingPolicy: (data) => api.put('/business/booking-policy', data),

  // Business Google Calendar
  connectGoogleCalendar: () => api.get('/google-calendar/connect'),
  disconnectGoogleCalendar: () => api.delete('/google-calendar/disconnect'),
  getCalendarStatus: () => api.get('/google-calendar/status'),
  syncBookings: () => api.post('/google-calendar/sync-bookings')
};

// ==================== CLIENT CALENDAR API ====================
export const clientCalendarAPI = {
  getAuthUrl: (clientEmail, bookingId = null) =>
    api.get('/google-calendar/connect-client', {
      params: { clientEmail, bookingId }
    }),
  checkStatus: (clientEmail) =>
    api.get('/google-calendar/status-client', {
      params: { clientEmail }
    }),
  disconnect: (clientEmail) =>
    api.delete('/google-calendar/disconnect-client', {
      data: { clientEmail }
    })
};

// ==================== SERVICES API ====================
export const servicesAPI = {
  // ── Public: use publicApi ──
  getByBusinessSlug: (slug) => publicApi.get(`/services/business/${slug}`),

  getMyServices: () => api.get('/services/my-services'),
  create: (formData) =>
    api.post('/services', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id, formData) =>
    api.put(`/services/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  delete: (id) => api.delete(`/services/${id}`)
};

// ==================== GALLERY API ====================
export const galleryAPI = {
  // ── Public: use publicApi ──
  getByBusinessSlug: (slug) => publicApi.get(`/gallery/business/${slug}`),

  getMyGallery: () => api.get('/gallery/my-gallery'),
  upload: (formData) =>
    api.post('/gallery', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`)
};

// ==================== BOOKINGS API ====================
export const bookingsAPI = {
  // ── Public: use publicApi for slot checking and booking creation ──
  create: (data) => publicApi.post('/bookings', data),
  getAvailableSlots: (businessSlug, date, params) =>
    publicApi.get(`/bookings/available-slots/${businessSlug}/${date}`, { params }),
  checkAvailability: (data) => publicApi.post('/bookings/check-availability', data),
  getClientBookings: (clientEmail, params) =>
    publicApi.get(`/bookings/client/${clientEmail}`, { params }),
  getById: (id) => publicApi.get(`/bookings/${id}`),

  // ── Authenticated: business-only actions ──
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status })
};

// ==================== CHAT API ====================
export const chatAPI = {
  // ── Public: client chat uses publicApi ──
  getClientMessages: (businessSlug, clientEmail) =>
    publicApi.get(`/chat/messages/client/${businessSlug}/${clientEmail}`),
  sendClientMessage: (data) => publicApi.post('/chat/send-client', data),

  // ── Authenticated: business chat ──
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (clientEmail) => api.get(`/chat/messages/${clientEmail}`),
  sendMessage: (data) => api.post('/chat/send', data),
  getUnreadCount: () => api.get('/chat/unread-count')
};

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  // ── Public: use publicApi ──
  getByBusinessSlug: (slug) => publicApi.get(`/reviews/business/${slug}`),
  create: (data) => publicApi.post('/reviews', data),

  // ── Authenticated: business reply ──
  getMyReviews: (params) => api.get('/reviews/my-reviews', { params }),
  reply: (id, businessReply) => api.put(`/reviews/${id}/reply`, { businessReply })
};

// ==================== AUTH HELPERS ====================
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');
export const isAuthenticated = () => !!localStorage.getItem('token');

export default api;