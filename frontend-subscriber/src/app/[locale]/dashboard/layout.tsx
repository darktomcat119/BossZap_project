"use client";

import { AppShell } from "@/components/layout/app-shell";
import { useWebSocket } from "@/hooks/use-websocket";

type Props = { children: React.ReactNode };

export default function DashboardLayout({ children }: Props) {
  useWebSocket();

  return <AppShell>{children}</AppShell>;
}
