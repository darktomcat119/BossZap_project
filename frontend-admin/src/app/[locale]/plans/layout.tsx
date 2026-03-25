import { AdminShell } from "@/components/layout/admin-shell";

type Props = { children: React.ReactNode };

export default function PlansLayout({ children }: Props) {
  return <AdminShell>{children}</AdminShell>;
}
