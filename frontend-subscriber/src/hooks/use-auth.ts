'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import { authService } from '@/services/auth.service';
import type {
  SubscriberProfile,
  LoginPayload,
  RegisterPayload,
} from '@/lib/types';

// ─── Context shape ───────────────────────────────────────────────────────────

interface AuthContextValue {
  user: SubscriberProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SubscriberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user from existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getProfile()
      .then((res) => {
        if (res.success) {
          setUser(res.data);
        }
      })
      .catch(() => {
        // Token invalid — clear it silently
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    if (!res.success) {
      throw new Error(res.error?.message || 'Login failed');
    }
    setUser(res.data.subscriber);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    if (!res.success) {
      throw new Error(res.error?.message || 'Registration failed');
    }
    setUser(res.data.subscriber);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    loading,
    login,
    register,
    logout,
  };

  return createElement(AuthContext.Provider, { value }, children);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
