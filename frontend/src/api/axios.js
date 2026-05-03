import axios from 'axios';

const api = axios.create({
  baseURL: "team-task-management-production-8ff1.up.railway.app",
});

// Add a request interceptor
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

// Add a response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // We could redirect to login here, but usually it's better handled in context
    }
    return Promise.reject(error);
  }
);

export default api;
