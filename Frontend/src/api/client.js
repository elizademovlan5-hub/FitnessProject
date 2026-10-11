import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7292/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fitness_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error) {
  if (error?.code === 'ERR_NETWORK') {
    return `Backend-ə qoşulmaq olmadı. API işləyir? Ünvan: ${API_BASE_URL}. Əvvəlcə https://localhost:7292/swagger səhifəsini açıb sertifikat xəbərdarlığını yoxla.`;
  }
  const data = error?.response?.data;
  if (typeof data?.message === 'string') return data.message;
  if (Array.isArray(data?.errors) && data.errors.length) return data.errors.join(' ');
  if (typeof data === 'string' && data.length) return data;
  if (error?.message) return error.message;
  return 'Naməlum xəta baş verdi. Yenidən yoxla.';
}

export default api;
