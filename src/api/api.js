// import axios from "axios";

// const api = axios.create({
//     baseURL: "http://127.0.0.1:8000/api",
//     withCredentials: true, // ✅ CRITICAL: Send cookies
//     headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//     },
// });

// // ✅ Add auth token if exists
// api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("auth_token");
//     if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
// });

// export default api;



import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000",
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    console.log('[API Request] Token:', token ? `Present (${token.substring(0, 20)}...)` : 'Missing');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API Request] Authorization header set');
    } else {
      console.warn('[API Request] No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API Response] 401 Unauthorized');
      console.error('[API Response] Request URL:', error.config?.url);
      console.error('[API Response] Auth header was:', error.config?.headers?.Authorization ? 'Present' : 'Missing');

      // Token expired or invalid - clear it
      const oldToken = localStorage.getItem("auth_token");
      if (oldToken) {
        console.warn('[API Response] Clearing invalid token from localStorage');
        localStorage.removeItem("auth_token");
      }

      // Only redirect to login if not already there
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        console.warn('Session expired. Please login again.');
      }
    } else {
      console.error(`[API Response] Error ${error.response?.status}:`, error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
