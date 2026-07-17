import { useEffect, useState } from 'react';
import adminApi from '../lib/adminApi';
import { AdminAuthStore } from './admin-auth-store';

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('pay_panda_admin_token'));
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    adminApi.get('/admin/auth/me').then(({ data }) => setAdmin(data.admin)).catch(() => logout()).finally(() => setLoading(false));
  }, [token]);
  useEffect(() => {
    const expire = () => logout();
    window.addEventListener('pay-panda:admin-auth-expired', expire);
    return () => window.removeEventListener('pay-panda:admin-auth-expired', expire);
  }, []);
  useEffect(() => {
    if (!token) return;
    const expiresAt = readExpiry(token);
    if (!expiresAt || expiresAt <= Date.now()) { logout(); return; }
    const timer = setTimeout(() => logout(), expiresAt - Date.now());
    return () => clearTimeout(timer);
  }, [token]);
  const authenticate = (nextToken, nextAdmin) => {
    localStorage.setItem('pay_panda_admin_token', nextToken); setToken(nextToken); setAdmin(nextAdmin);
  };
  const logout = () => { localStorage.removeItem('pay_panda_admin_token'); setToken(null); setAdmin(null); };
  return <AdminAuthStore.Provider value={{ token, admin, loading, authenticate, logout }}>{children}</AdminAuthStore.Provider>;
}

function readExpiry(token) {
  try {
    const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')));
    return Number(payload.exp) * 1000;
  } catch { return 0; }
}
