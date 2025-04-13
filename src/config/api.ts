import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { store } from "@/redux/store";

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  // baseURL: "http://localhost:8080",
  baseURL: "https://warehouse-backend-jlcj5.ondigitalocean.app",
});

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

export default api;
