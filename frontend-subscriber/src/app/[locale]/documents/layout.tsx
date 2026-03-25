import { AppShell } from "@/components/layout/app-shell";

type Props = { children: React.ReactNode };

export default function DocumentsLayout({ children }: Props) {
  return <AppShell>{children}</AppShell>;
}
