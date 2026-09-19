import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('energy_dashboard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('energy_dashboard_token');
      const storedUser = localStorage.getItem('energy_dashboard_user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      } else if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('energy_dashboard_user', JSON.stringify(res.data.user));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('energy_dashboard_token', token);
    localStorage.setItem('energy_dashboard_user', JSON.stringify(user));
    return user;
  };

  const register = async (name, email, password) => {
    const res = await apiClient.post('/auth/register', { name, email, password });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('energy_dashboard_token', token);
    localStorage.setItem('energy_dashboard_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('energy_dashboard_token');
    localStorage.removeItem('energy_dashboard_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
