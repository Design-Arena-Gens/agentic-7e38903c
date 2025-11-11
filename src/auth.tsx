import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';

export type Role = 'admin' | 'instructor' | 'member';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      api.setToken(token);
      api.get('/auth/me').then((res) => setUser(res.data)).catch(() => setUser(null));
    } else {
      localStorage.removeItem('token');
      api.setToken(null);
      setUser(null);
    }
  }, [token]);

  const value = useMemo<AuthContextType>(() => ({
    token,
    user,
    login: async (email: string, password: string) => {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
    },
    logout: () => setToken(null)
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
