import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { store } from "@/contexts/redux/store";
import { setCredentials, logout } from "@/contexts/redux/features/userSlice";

// Extend InternalAxiosRequestConfig to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Flag to track if token refresh is in progress
let isRefreshing = false;
// Store for failed requests that will be retried after token refresh
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

// Process failed queue
const processQueue = (error: Error | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Add request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get the current state from Redux store
    const state = store.getState();
    const access_token = state.user.accessToken;

    // If token exists, add it to request headers
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // If there's no config, or error is not 401, or it's already a retry, reject
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // If token refresh is in progress, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const state = store.getState();
    const refreshToken = state.user.refreshToken;
    console.log(refreshToken);
    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/account/refresh-token`,
        {},
        {
          headers: {
            Authorization: `Bearer ${refreshToken}`,
          },
        }
      );

      const { access_token, refresh_token } = response.data.content;

      // Update tokens in Redux store
      store.dispatch(
        setCredentials({
          accessToken: access_token,
          refreshToken: refresh_token,
        })
      );

      // Update authorization header for the original request
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      // Process queued requests
      processQueue(null);

      return api(originalRequest);
    } catch (refreshError) {
      // If refresh token fails, logout user and reject all queued requests
      store.dispatch(logout());
      processQueue(new Error("Refresh token failed"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
