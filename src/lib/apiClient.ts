import axios, { AxiosError } from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds — AI generation can take 60-120s
});

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if present
    const token = localStorage.getItem('canvas_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Extra-long timeout for AI/exam generation endpoints
    const url = config.url || '';
    if (url.includes('/exams/generate') || url.includes('/ai/')) {
      config.timeout = 180000; // 3 minutes for AI endpoints
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
      
      // Return structured error — preserve response so callers can inspect it
      const errorMessage = (data as any)?.message || (data as any)?.error || 'An error occurred';
      const structuredError = new Error(errorMessage) as any;
      structuredError.statusCode = status;
      structuredError.responseData = data;
      return Promise.reject(structuredError);
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
