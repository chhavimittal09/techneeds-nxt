'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, setStoredUser, getStoredUser } from './api';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
    }
    
    // Validate session with backend
    api.getMe()
      .then((res) => {
        if (res?.user) {
          setUser(res.user);
          setStoredUser(res.user);
        }
      })
      .catch(() => {
        // Token invalid or expired
        setUser(null);
        setToken(null);
        setStoredUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async ({ identifier, password, role }) => {
    const res = await api.login({ identifier, password, role });
    if (res?.token && res?.user) {
      setToken(res.token);
      setStoredUser(res.user);
      setUser(res.user);
      return res.user;
    }
    throw new Error('Invalid login response');
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res?.user) {
        setUser(res.user);
        setStoredUser(res.user);
        return res.user;
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isMentor: user?.role === 'mentor',
    isMentee: user?.role === 'mentee',
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
