"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { Menu, Globe } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

const localeLabels: Record<string, string> = {
  es: "ES",
  en: "EN",
  "pt-BR": "PT",
};

const locales = ["es", "en", "pt-BR"] as const;

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const tCommon = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (locale: string) => {
    router.replace(pathname, { locale: locale as any });
    setLangMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-text-secondary hover:bg-background md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* App name on mobile */}
          <span className="text-lg font-bold text-primary md:hidden">
            {tCommon("appName")}
          </span>

          {/* Spacer for desktop */}
          <div className="hidden md:block" />

          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-background"
              aria-label="Switch language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Language</span>
            </button>

            {langMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 z-50 mt-1 w-32 rounded-lg border border-border bg-surface py-1 shadow-lg">
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => switchLocale(locale)}
                      className={cn(
                        "flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-background",
                        "text-text-secondary hover:text-text-primary"
                      )}
                    >
                      {localeLabels[locale]}
                      {locale === "pt-BR" && (
                        <span className="ml-1 text-text-muted">
                          (Brasil)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
