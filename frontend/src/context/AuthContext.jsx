import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize CSRF and verify session
  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    setLoading(true);
    try {
      // 1. Fetch CSRF token to prime XSRF-TOKEN cookie for state-changing calls
      await authService.getCsrf();

      // 2. Query backend to check if an active session exists
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      // Not authenticated / session expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    // Prime CSRF token first
    await authService.getCsrf();
    const loggedInUser = await authService.login({ email, password });
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (userData) => {
    // Prime CSRF token first
    await authService.getCsrf();
    const createdUser = await authService.register(userData);
    return createdUser;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network error on logout
    } finally {
      setUser(null);
    }
  };

  const isFarmer = () => {
    return user?.role === 'FARMER' || user?.role === 'ADMIN';
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isFarmer,
    isAdmin,
    refreshUser: initAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
