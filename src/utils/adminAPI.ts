import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const adminAPI = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPIs = {
  // Auth
  login: (email: string, password: string) =>
    adminAPI.post('/login', { email, password }),

  // Stats
  getStats: () => adminAPI.get('/stats'),

  // Businesses
  getBusinesses: (params?: any) => adminAPI.get('/businesses', { params }),
  getBusiness: (id: string) => adminAPI.get(`/businesses/${id}`),
  updateSubscription: (id: string, data: any) =>
    adminAPI.put(`/businesses/${id}/subscription`, data),
  pauseBusiness: (id: string, isPaused: boolean, reason?: string) =>
    adminAPI.put(`/businesses/${id}/pause`, { isPaused, reason }),
  deleteBusiness: (id: string) => adminAPI.delete(`/businesses/${id}`),
  extendTrial: (id: string, days: number) =>
    adminAPI.put(`/businesses/${id}/extend-trial`, { days })
};

export default adminAPIs;