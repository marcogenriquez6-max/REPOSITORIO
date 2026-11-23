import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import type { AuthResponse, User } from '../types';

type AuthCtx = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api.get('/auth/me').then((res) => {
      const data = (res.data as any).data ?? res.data;
      if (!cancelled && data) setUser(data as User);
    }).catch(() => {
      if (cancelled) return;
      setToken(null);
      setUser(null);
      localStorage.removeItem('refreshToken');
    });
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    const onRefreshed = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data?.token) setToken(data.token);
      if (data?.user) setUser(data.user as User);
    };
    const onExpired = () => {
      setToken(null);
      setUser(null);
      localStorage.removeItem('refreshToken');
    };
    window.addEventListener('unior:auth-refreshed', onRefreshed);
    window.addEventListener('unior:session-expired', onExpired);
    return () => {
      window.removeEventListener('unior:auth-refreshed', onRefreshed);
      window.removeEventListener('unior:session-expired', onExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse | { data: AuthResponse }>('/auth/login', { email, password });
    const data = (res.data as any).data || res.data;
    setToken(data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
    if (localStorage.getItem('refreshToken')) {
      void api.post('/auth/logout').catch(() => undefined);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
