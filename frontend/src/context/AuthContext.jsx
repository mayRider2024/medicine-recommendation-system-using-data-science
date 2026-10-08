import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return 'http://localhost:8000/api';
  const clean = url.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

const API_BASE_URL = getBaseUrl();

const authContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const storedToken = localStorage.getItem('medicine_token');
    const storedUser = localStorage.getItem('medicine_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // Interceptor to attach token
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, patient } = res.data;
    setToken(access_token);
    setUser(patient);
    localStorage.setItem('medicine_token', access_token);
    localStorage.setItem('medicine_user', JSON.stringify(patient));
    return patient;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    const { access_token, patient } = res.data;
    setToken(access_token);
    setUser(patient);
    localStorage.setItem('medicine_token', access_token);
    localStorage.setItem('medicine_user', JSON.stringify(patient));
    return patient;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('medicine_token');
    localStorage.removeItem('medicine_user');
  };

  const updateProfile = async (updates) => {
    const res = await api.put('/auth/profile', updates);
    setUser(res.data);
    localStorage.setItem('medicine_user', JSON.stringify(res.data));
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    api,
  };

  return (
    <authContext.Provider value={value}>
      {!loading && children}
    </authContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(authContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
