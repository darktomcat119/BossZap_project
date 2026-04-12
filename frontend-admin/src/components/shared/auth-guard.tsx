"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AdminAuthGuard({ children }: AuthGuardProps) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace(`/${locale}/login`);
    } else {
      setReady(true);
    }
  }, [router, locale]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
