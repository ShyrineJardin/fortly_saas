import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Simple in-memory cache ──
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(key) {
  cache.delete(key);
}

export function invalidatePrefix(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

async function cachedGet(apiFn, cacheKey) {
  const cached = getCached(cacheKey);
  if (cached) return cached;
  const result = await apiFn();
  setCached(cacheKey, result);
  return result;
}

// ── Authenticated instance ──
const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

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
    return Promise.reject(error);
  }
);

// ── Public instance ──
const publicApi = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });
publicApi.interceptors.response.use((response) => response, (error) => Promise.reject(error));

// ==================== AUTH API ====================
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => cachedGet(() => api.get('/auth/me'), 'auth-me'),
  deleteAccount: () => api.delete('/auth/account'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data)
};

// ==================== BUSINESS API ====================
export const businessAPI = {
  getBySlug: (slug) => cachedGet(() => publicApi.get(`/business/${slug}`), `business-slug-${slug}`),
  completeOnboarding: (formData) => api.put('/business/onboarding', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProfile: async (formData) => {
    invalidatePrefix('business-slug-');
    invalidateCache('auth-me');
    return api.put('/business/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  updateBookingPolicy: async (data) => {
    invalidateCache('auth-me');
    invalidatePrefix('business-slug-');
    return api.put('/business/booking-policy', data);
  },
  connectGoogleCalendar: () => api.get('/google-calendar/connect'),
  disconnectGoogleCalendar: () => api.delete('/google-calendar/disconnect'),
  getCalendarStatus: () => api.get('/google-calendar/status'),
  syncBookings: () => api.post('/google-calendar/sync-bookings')
};

// ==================== CLIENT CALENDAR API ====================
export const clientCalendarAPI = {
  getAuthUrl: (clientEmail, bookingId = null) => api.get('/google-calendar/connect-client', { params: { clientEmail, bookingId } }),
  checkStatus: (clientEmail) => api.get('/google-calendar/status-client', { params: { clientEmail } }),
  disconnect: (clientEmail) => api.delete('/google-calendar/disconnect-client', { data: { clientEmail } })
};

// ==================== SERVICES API ====================
export const servicesAPI = {
  getByBusinessSlug: (slug) => cachedGet(() => publicApi.get(`/services/business/${slug}`), `services-slug-${slug}`),
  getMyServices: () => cachedGet(() => api.get('/services/my-services'), 'services-mine'),
  create: async (formData) => {
    invalidateCache('services-mine'); invalidateCache('auth-me');
    return api.post('/services', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: async (id, formData) => {
    invalidateCache('services-mine'); invalidateCache('auth-me');
    return api.put(`/services/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: async (id) => {
    invalidateCache('services-mine'); invalidateCache('auth-me');
    return api.delete(`/services/${id}`);
  }
};

// ==================== GALLERY API ====================
export const galleryAPI = {
  getByBusinessSlug: (slug) => cachedGet(() => publicApi.get(`/gallery/business/${slug}`), `gallery-slug-${slug}`),
  getMyGallery: () => cachedGet(() => api.get('/gallery/my-gallery'), 'gallery-mine'),
  upload: async (formData) => {
    invalidateCache('gallery-mine');
    return api.post('/gallery', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: async (id, data) => {
    invalidateCache('gallery-mine');
    return api.put(`/gallery/${id}`, data);
  },
  delete: async (id) => {
    invalidateCache('gallery-mine');
    return api.delete(`/gallery/${id}`);
  }
};

// ==================== BOOKINGS API ====================
export const bookingsAPI = {
  create: (data) => publicApi.post('/bookings', data),
  getAvailableSlots: (businessSlug, date, params) => publicApi.get(`/bookings/available-slots/${businessSlug}/${date}`, { params }),
  checkAvailability: (data) => publicApi.post('/bookings/check-availability', data),
  getClientBookings: (clientEmail, params) => publicApi.get(`/bookings/client/${clientEmail}`, { params }),
  getById: (id) => publicApi.get(`/bookings/${id}`),
  reschedule: (id, data) => api.put(`/bookings/${id}/reschedule`, data),
  cancel: (id, data) => api.put(`/bookings/${id}/cancel`, data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status })
};

// ==================== CHAT API ====================
export const chatAPI = {
  getClientMessages: (businessSlug, clientEmail) => publicApi.get(`/chat/messages/client/${businessSlug}/${clientEmail}`),
  sendClientMessage: (data) => publicApi.post('/chat/send-client', data),
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (clientEmail) => api.get(`/chat/messages/${clientEmail}`),
  sendMessage: (data) => api.post('/chat/send', data),
  getUnreadCount: () => api.get('/chat/unread-count')
};

// ==================== REVIEWS API ====================
export const reviewsAPI = {
  getByBusinessSlug: (slug) => cachedGet(() => publicApi.get(`/reviews/business/${slug}`), `reviews-slug-${slug}`),
  getMyReviews: (params) => cachedGet(() => api.get('/reviews/my-reviews', { params }), 'reviews-mine'),
  create: async (data) => {
    invalidatePrefix('reviews-slug-');
    return publicApi.post('/reviews', data);
  },
  reply: async (id, businessReply) => {
    invalidateCache('reviews-mine');
    invalidatePrefix('reviews-slug-');
    return api.put(`/reviews/${id}/reply`, { businessReply });
  }
};

// ==================== AUTH HELPERS ====================
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');
export const isAuthenticated = () => !!localStorage.getItem('token');

export default api;