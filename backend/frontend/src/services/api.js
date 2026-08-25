import axios from "axios";

/**
 * Base URL resolution:
 *  - VITE_API_URL env wins when provided (deployments)
 *  - default is the relative "/api/v1" path, which the Vite dev
 *    proxy forwards to the FastAPI backend on :8000
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
  timeout: 8000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
