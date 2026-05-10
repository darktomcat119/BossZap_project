"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter, usePathname, Link } from "@/i18n/routing";
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  FileText,
  Package,
  User,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/financial", labelKey: "financial", icon: DollarSign },
  { href: "/calendar", labelKey: "calendar", icon: Calendar },
  { href: "/documents", labelKey: "documents", icon: FileText },
  { href: "/catalog", labelKey: "catalog", icon: Package },
  { href: "/profile", labelKey: "profile", icon: User },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const isActive = (href: string) => pathname.startsWith(href);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // Always navigate even if the server call fails — tokens are
      // already cleared locally by authService.logout's finally block.
      router.replace("/login");
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-surface transition-transform duration-300 ease-out",
          "md:translate-x-0 md:static md:z-auto",
          "border-r border-border/50",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/bosszap_logo.png"
              alt="BossZap"
              width={36}
              height={38}
              className="h-9 w-auto"
            />
            <span className="text-lg font-bold tracking-tight text-text-primary">
              {tCommon("appName")}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary shadow-sm"
                        : "text-text-secondary hover:bg-background hover:text-text-primary",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-all",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-text-muted group-hover:text-text-secondary",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span>{t(item.labelKey)}</span>
                    {active && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-danger/5 hover:text-danger"
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
