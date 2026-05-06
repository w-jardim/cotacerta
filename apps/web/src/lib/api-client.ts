import axios from 'axios';
import { authStorage } from '../features/auth/auth-storage';

// Em produção via Nginx proxy, usa /api
// Em desenvolvimento local, usa http://localhost:3401
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3401';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona token em todas as requisições se existir
apiClient.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Remove token se receber 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
