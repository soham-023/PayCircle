import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('paycircle_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('paycircle_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      userAPI.getProfile()
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('paycircle_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (usernameOrPhone, password) => {
    const res = await authAPI.login({ usernameOrPhone, password });
    const { token, user } = res.data;
    localStorage.setItem('paycircle_token', token);
    localStorage.setItem('paycircle_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    const { token, user } = res.data;
    localStorage.setItem('paycircle_token', token);
    localStorage.setItem('paycircle_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('paycircle_token');
    localStorage.removeItem('paycircle_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data);
      localStorage.setItem('paycircle_user', JSON.stringify(res.data));
    } catch (e) {
      console.error('Failed to refresh profile', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
