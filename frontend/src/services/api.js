import axios from 'axios';
import { useAuthStore } from '../store/authstore';
import { emitSessionActivity } from '../auth/sessionEvents';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    emitSessionActivity();
    return res;
  },
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(err);
  },
);
