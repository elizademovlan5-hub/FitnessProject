import { createContext, useContext, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

function loadUser() {
  try { return JSON.parse(localStorage.getItem('fitness_user') || 'null'); }
  catch { return null; }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('fitness_token'));
  const [user, setUser] = useState(loadUser);

  const login = async (credentials) => {
    const { data } = await api.post('/Auth/login', credentials);
    localStorage.setItem('fitness_token', data.token);
    localStorage.setItem('fitness_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = (values) => api.post('/Auth/register', values).then(({ data }) => data);
  const verifyEmail = (values) => api.post('/Auth/verify-email', values).then(({ data }) => data);
  const resendOtp = (values) => api.post('/Auth/resend-otp', values).then(({ data }) => data);

  const logout = () => {
    localStorage.removeItem('fitness_token');
    localStorage.removeItem('fitness_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/Profile/me');
    const nextUser = { ...user, ...data, roles: data.roles || user?.roles || [] };
    localStorage.setItem('fitness_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const value = useMemo(() => ({
    token, user, login, register, verifyEmail, resendOtp, logout, refreshProfile,
    isAdmin: user?.roles?.some((role) => String(role).toLowerCase() === 'admin') || false
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth yalnız AuthProvider daxilində istifadə oluna bilər.');
  return context;
}
