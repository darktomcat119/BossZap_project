"use client";

import { AdminShell } from "@/components/layout/admin-shell";
import { AdminAuthGuard } from "@/components/shared/auth-guard";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
