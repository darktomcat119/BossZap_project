import { AppShell } from "@/components/layout/app-shell";

type Props = { children: React.ReactNode };

export default function CalendarLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
