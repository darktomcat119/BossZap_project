"use client";

import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  FileText,
  User,
} from "lucide-react";
import { usePathname, Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ElementType;
};

const items: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/financial", labelKey: "financial", icon: DollarSign },
  { href: "/calendar", labelKey: "calendar", icon: Calendar },
  { href: "/documents", labelKey: "documents", icon: FileText },
  { href: "/profile", labelKey: "profile", icon: User },
];

/**
 * Mobile-only bottom tab bar. Replaces the dated hamburger pattern on
 * small screens — desktop still uses the side rail. Sits fixed to the
 * bottom edge with safe-area inset padding for iOS home-indicator.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-text-muted hover:text-text-secondary",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110",
                  )}
                />
                <span className="truncate">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
