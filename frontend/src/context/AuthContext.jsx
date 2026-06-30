import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (clearOnError = true) => {
    try {
      const response = await axiosInstance.get('/auth/profile/');
      setUser(response.data);
    } catch (error) {
      if (clearOnError) {
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post('/auth/login/', { email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      if (response.data.user) {
        setUser(response.data.user);
      }
      await fetchProfile(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        error: error.response?.data?.detail || 'Credenciales incorrectas'
      };
    }
  };

  const register = async (email, password, passwordConfirm, firstName, lastName) => {
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register/', {
        email,
        password,
        password_confirm: passwordConfirm,
        first_name: firstName,
        last_name: lastName
      });
      // Iniciar sesión automáticamente tras el registro exitoso
      return await login(email, password);
    } catch (error) {
      setLoading(false);
      return {
        success: false,
        error: error.response?.data || { detail: 'Error al registrarse' }
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axiosInstance.put('/auth/profile/', profileData);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || { detail: 'Error al actualizar el perfil' }
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAdmin: user?.role === 'Admin',
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
