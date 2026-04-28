'use client';

import { useEffect, useState } from 'react';
import { AdminSidebar } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { notificationsApi } from '@/lib/api';
import type { NotificationsSummary } from '@/lib/types';

type AdminShellProps = {
  children: React.ReactNode;
};

const POLL_MS = 60_000;

export function AdminShell({ children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const raw = (await notificationsApi.summary()) as NotificationsSummary | { data?: NotificationsSummary };
        const summary = (raw && 'data' in raw && raw.data ? raw.data : raw) as NotificationsSummary;
        if (!cancelled) setUnreadCount(summary?.total ?? 0);
      } catch {
        // Silent — bell just shows 0
      }
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      <AdminSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <AdminHeader
        unreadCount={unreadCount}
        onMobileMenuClick={() => setMobileNavOpen(true)}
      />
      <main className="lg:ml-[var(--sidebar-width)] min-h-dvh pt-[var(--header-height)]">
        {children}
      </main>
    </div>
  );
}
