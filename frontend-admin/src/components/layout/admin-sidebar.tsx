'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  BarChart3,
  ScrollText,
  Activity,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  labelKey: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { labelKey: 'overview', href: '/overview', icon: LayoutDashboard },
  { labelKey: 'subscribers', href: '/subscribers', icon: Users },
  { labelKey: 'payments', href: '/payments', icon: CreditCard },
  { labelKey: 'plans', href: '/plans', icon: Package },
  { labelKey: 'metrics', href: '/metrics', icon: BarChart3 },
  { labelKey: 'logs', href: '/logs', icon: ScrollText },
  { labelKey: 'health', href: '/health', icon: Activity },
  { labelKey: 'templates', href: '/templates', icon: MessageSquare },
];

export function AdminSidebar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-sm px-md h-[var(--header-height)] border-b border-border shrink-0">
        <Image
          src="/bosszap_logo.png"
          alt="BossZap"
          width={32}
          height={34}
          className="h-8 w-auto"
        />
        <span className="font-semibold text-h4 text-text-primary">
          {tCommon('appName')}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-sm px-sm">
        <ul className="space-y-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-sm px-md py-[10px] rounded-button text-body transition-colors duration-150',
                    active
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  )}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-[10px] left-md z-50 w-9 h-9 flex items-center justify-center rounded-button bg-surface shadow-card"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-text-primary" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] bg-surface border-r border-border flex flex-col transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute top-md right-md w-8 h-8 flex items-center justify-center rounded-button hover:bg-background"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-text-secondary" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[var(--sidebar-width)] bg-surface border-r border-border flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
