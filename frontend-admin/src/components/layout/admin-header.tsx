'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, ChevronDown, LogOut, Menu, User } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

function decodeJwtEmail(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.email ?? decoded?.sub ?? null;
  } catch {
    return null;
  }
}

type AdminHeaderProps = {
  unreadCount?: number;
  onMobileMenuClick?: () => void;
};

export function AdminHeader({ unreadCount = 0, onMobileMenuClick }: AdminHeaderProps) {
  const tc = useTranslations('common');
  const tp = useTranslations('profile');
  const tn = useTranslations('notifications');
  const { logout } = useAdminAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEmail(decodeJwtEmail(localStorage.getItem('admin_access_token')));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const initial = (email ?? 'A').charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20',
        'left-0 lg:left-[var(--sidebar-width)]',
        'h-[var(--header-height)] bg-surface border-b border-border',
        'flex items-center justify-between gap-sm px-md',
      )}
    >
      {/* Left: mobile hamburger */}
      <button
        type="button"
        onClick={onMobileMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-button hover:bg-background transition-colors"
        aria-label={tc('openMenu')}
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>
      <div className="hidden lg:block" />

      {/* Right: bell + user */}
      <div className="flex items-center gap-sm">
      {/* Notification bell */}
      <Link
        href="/notifications"
        className="relative w-9 h-9 flex items-center justify-center rounded-button hover:bg-background transition-colors"
        aria-label={tn('title')}
      >
        <Bell className="w-5 h-5 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      <div className="w-px h-6 bg-border" />

      {/* Admin user dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-sm pl-1 pr-2 py-1 rounded-button hover:bg-background transition-colors"
        >
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-caption">
            {initial}
          </span>
          <span className="hidden sm:inline text-body text-text-primary truncate max-w-[180px]">
            {email ?? 'admin'}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-text-secondary transition-transform',
              menuOpen && 'rotate-180',
            )}
          />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-56 rounded-card border border-border bg-surface shadow-lg overflow-hidden">
            <div className="px-md py-sm border-b border-border">
              <div className="flex items-center gap-sm">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="text-caption text-text-secondary">{tp('administrator')}</p>
                  <p className="text-body font-medium text-text-primary truncate">
                    {email ?? 'admin'}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-sm px-md py-sm text-body text-text-primary hover:bg-background transition-colors"
            >
              <User className="w-4 h-4 text-text-secondary" />
              {tp('myProfile')}
            </Link>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-sm px-md py-sm text-body text-text-primary hover:bg-background transition-colors border-t border-border"
            >
              <LogOut className="w-4 h-4 text-text-secondary" />
              {tp('logout')}
            </button>
          </div>
        )}
      </div>
      </div>
    </header>
  );
}
