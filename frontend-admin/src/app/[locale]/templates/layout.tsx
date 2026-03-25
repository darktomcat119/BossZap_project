import { AdminShell } from "@/components/layout/admin-shell";

type Props = { children: React.ReactNode };

export default function TemplatesLayout({ children }: Props) {
  return <AdminShell>{children}</AdminShell>;
}
