import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
  (error) => {
    // Handle 401 globally if needed (e.g. redirect to login)
    if (error.response && error.response.status === 401) {
      // Clear storage
      localStorage.removeItem('canvas_token');
      localStorage.removeItem('canvas_user');
      // window.location.href = '/login'; // Alternatively let the App handle routing state
    }
    return Promise.reject(error);
  }
);

export default apiClient;
