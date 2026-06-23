import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

// Use sessionStorage so each browser tab/window has its own independent session.
// This prevents a faculty login in one tab from leaking into a student tab,
// and allows multiple parallel logins (e.g. faculty + student) on the same machine.
const store = {
  get: (key) => sessionStorage.getItem(key),
  set: (key, val) => sessionStorage.setItem(key, val),
  remove: (key) => sessionStorage.removeItem(key),
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = store.get('labscan_user');
    const token = store.get('labscan_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        store.remove('labscan_user');
        store.remove('labscan_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password, portalType) => {
    const res = await authApi.login(identifier, password, portalType);
    const { accessToken, refreshToken, user: u } = res.data;
    store.set('labscan_token', accessToken);
    store.set('labscan_refresh', refreshToken);
    store.set('labscan_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const res = await authApi.register(name, email, password, role);
    const { accessToken, refreshToken, user: u } = res.data;
    store.set('labscan_token', accessToken);
    store.set('labscan_refresh', refreshToken);
    store.set('labscan_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    const refreshToken = store.get('labscan_refresh');
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {});
    }
    store.remove('labscan_token');
    store.remove('labscan_refresh');
    store.remove('labscan_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
