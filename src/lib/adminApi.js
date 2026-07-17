import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const adminApi = axios.create({ baseURL: API_URL, timeout: 20000 });

adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('pay_panda_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
adminApi.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && location.pathname.startsWith('/admin')) {
    localStorage.removeItem('pay_panda_admin_token');
    window.dispatchEvent(new CustomEvent('pay-panda:admin-auth-expired'));
  }
  return Promise.reject(error);
});

export default adminApi;
