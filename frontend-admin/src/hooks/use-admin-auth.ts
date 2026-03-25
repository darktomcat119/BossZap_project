'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { adminLogin as loginService, adminLogout as logoutService } from '@/services/auth.service';

type UseAdminAuth = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export function useAdminAuth(): UseAdminAuth {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginService(email, password);
      setIsAuthenticated(true);
      router.push('/overview');
    },
    [router],
  );

  const logout = useCallback(() => {
    logoutService();
    setIsAuthenticated(false);
    router.push('/login');
  }, [router]);

  // Redirect to /login when not authenticated (after initial load)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const path = window.location.pathname;
      // Don't redirect if already on the login page
      if (!path.includes('/login')) {
        router.push('/login');
      }
    }
  }, [loading, isAuthenticated, router]);

  return { isAuthenticated, loading, login, logout };
}
