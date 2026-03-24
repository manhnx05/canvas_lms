import axios, { AxiosError } from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if present
    const token = localStorage.getItem('canvas_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle different error types
    if (error.response) {
      const { status, data } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        // Clear storage and redirect to login
        localStorage.removeItem('canvas_token');
        localStorage.removeItem('canvas_user');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Handle authorization errors
      if (status === 403) {
        console.error('Access denied:', data);
      }
      
      // Handle validation errors
      if (status === 400) {
        console.error('Validation error:', data);
      }
      
      // Handle not found errors
      if (status === 404) {
        console.error('Resource not found:', data);
      }
      
      // Handle server errors
      if (status >= 500) {
        console.error('Server error:', data);
      }
      
      // Return structured error
      const errorMessage = (data as any)?.message || (data as any)?.error || 'An error occurred';
      return Promise.reject(new Error(errorMessage));
    }
    
    // Handle network errors
    if (error.request) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

export default apiClient;
