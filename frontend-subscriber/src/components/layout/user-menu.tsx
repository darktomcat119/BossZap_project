"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * Header user menu — avatar + business/owner name with dropdown for
 * profile shortcut and logout. Falls back to a generic avatar when the
 * subscriber hasn't uploaded a logo yet.
 */
export function UserMenu() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  // Falls back to the initials avatar when the logo URL resolves but
  // the image fails to load (expired pre-signed URL, deleted S3 object,
  // network blip). Without this, the browser's broken-image icon leaks
  // into the header.
  const [logoFailed, setLogoFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Reset the load-error flag whenever the logo URL changes, so a fresh
  // upload (or pre-signed URL refresh) gets a chance to render again.
  useEffect(() => {
    setLogoFailed(false);
  }, [user?.logo_url]);

  if (!user) return null;

  const displayName = user.business_name || user.owner_name || user.email || tCommon("appName");
  const subline = user.owner_name && user.business_name ? user.owner_name : user.email ?? user.phone ?? "";

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  };

  // Two-letter initial for the avatar fallback
  const initials = (() => {
    const source = user.business_name || user.owner_name || user.email || "?";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || source[0]?.toUpperCase() || "?";
  })();

  const showLogo = Boolean(user.logo_url) && !logoFailed;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-sm transition-colors hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {showLogo ? (
          <span className="relative h-8 w-8 overflow-hidden rounded-full border border-border bg-background">
            <Image
              src={user.logo_url!}
              alt={displayName}
              fill
              unoptimized
              sizes="32px"
              className="object-cover"
              onError={() => setLogoFailed(true)}
            />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-xs font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[140px] truncate text-text-primary md:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          {/* Header card with avatar + name + subline */}
          <div className="flex items-center gap-3 border-b border-border bg-background/40 px-4 py-3">
            {showLogo ? (
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-background">
                <Image
                  src={user.logo_url!}
                  alt={displayName}
                  fill
                  unoptimized
                  sizes="40px"
                  className="object-cover"
                  onError={() => setLogoFailed(true)}
                />
              </span>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-semibold text-white">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">
                {displayName}
              </p>
              {subline && (
                <p className="truncate text-xs text-text-muted">{subline}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-background"
            >
              <UserIcon className="h-4 w-4 text-text-muted" />
              {t("profile")}
            </Link>
            <button
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/5"
            >
              <LogOut className="h-4 w-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
