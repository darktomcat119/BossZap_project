import { AdminShell } from "@/components/layout/admin-shell";

type Props = { children: React.ReactNode };

export default function SubscribersLayout({ children }: Props) {
  return <AdminShell>{children}</AdminShell>;
}
