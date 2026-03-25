import { AppShell } from "@/components/layout/app-shell";

type Props = { children: React.ReactNode };

export default function FinancialLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
