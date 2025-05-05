import axios from 'axios';

// Configure base URL for all API requests
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User API service
export const userService = {
  login: (email, accessCode) => api.post('/users/login', { email, accessCode }),
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Door API service
export const doorService = {
  getAll: () => api.get('/doors'),
  getById: (id) => api.get(`/doors/${id}`),
  create: (doorData) => api.post('/doors', doorData),
  update: (id, doorData) => api.put(`/doors/${id}`, doorData),
  delete: (id) => api.delete(`/doors/${id}`),
  grantAccess: (doorId, userId) => api.post(`/doors/${doorId}/access/${userId}`),
  revokeAccess: (doorId, userId) => api.delete(`/doors/${doorId}/access/${userId}`),
};

// Access API service
export const accessService = {
  verifyCode: (doorId, accessCode) => api.post('/access/code', { doorId, accessCode }),
  verifyFace: (doorId, faceData, imagePath = null) => api.post('/access/face', { doorId, faceData, imagePath }),
  logMotion: (doorId, imagePath = null) => api.post('/access/motion', { doorId, imagePath }),
  doubleVerify: (doorId, userId, accessCode = null, faceData = null) => 
    api.post('/access/double-verify', { doorId, userId, accessCode, faceData }),
  getLogs: (params) => api.get('/access/logs', { params }),
  getLogImage: (logId) => api.get(`/access/logs/${logId}/image`, { responseType: 'blob' }),
};

export default {
  userService,
  doorService,
  accessService,
};