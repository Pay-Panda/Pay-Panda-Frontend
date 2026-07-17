import { createContext, useContext } from 'react';

export const AdminAuthStore = createContext(null);
export const useAdminAuth = () => useContext(AdminAuthStore);
