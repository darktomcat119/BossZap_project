"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/shared/auth-guard";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
