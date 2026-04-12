"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/shared/auth-guard";
import { useWebSocket } from "@/hooks/use-websocket";

type Props = { children: React.ReactNode };

export default function DashboardLayout({ children }: Props) {
  useWebSocket();

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
