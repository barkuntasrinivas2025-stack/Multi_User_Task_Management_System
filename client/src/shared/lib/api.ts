import axios from 'axios';
import { toast } from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response) {
      const status = err.response.status;
      if (status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please sign in again.');
      } else if (status === 503) {
        toast.error('Server is waking up... please wait a moment and try again.');
      } else {
        const errMsg = err.response.data?.error ?? 'An unexpected error occurred';
        toast.error(errMsg);
      }
    } else {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(err);
  }
);
