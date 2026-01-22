import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
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

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
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
  // Booking Policy
  updateBookingPolicy: (data) => api.put('/business/booking-policy', data)
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

// ==================== BOOKINGS API ====================

export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getAvailableSlots: (businessSlug, date) => 
    api.get(`/bookings/available-slots/${businessSlug}/${date}`)
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