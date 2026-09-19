import axios from 'axios';

// In production on Vercel, relative path '/api' uses same-origin Vercel serverless rewrites.
// In local development, defaults to 'http://localhost:5000/api' when VITE_API_URL is unset.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor to attach JWT token to all authenticated requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('energy_dashboard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthenticated 401
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('energy_dashboard_token');
      localStorage.removeItem('energy_dashboard_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
