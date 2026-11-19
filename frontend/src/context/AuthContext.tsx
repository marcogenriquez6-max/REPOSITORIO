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
    return raw ? (JSON.parse(raw) as User) : null;
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

  const login = async (email: string, password: string) => {
    const res = await api.post<AuthResponse | { data: AuthResponse }>('/auth/login', { email, password });
    const data = (res.data as any).data || res.data;
    setToken(data.token);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
  };

  const logout = () => {
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
