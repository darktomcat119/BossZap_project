'use client';

import { AdminSidebar } from './admin-sidebar';

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <AdminSidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-dvh pt-[var(--header-height)] lg:pt-0">
        {children}
      </main>
    </div>
  );
}
