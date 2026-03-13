import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Global axios interceptor - handle auth errors silently
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('Auth error:', error.response?.status);
    }
    return Promise.reject(error);
  }
);

export { API, BACKEND_URL };
export default axios;
