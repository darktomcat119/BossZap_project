"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
} from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { useWebSocketEvent } from "@/hooks/use-websocket";
import { cn } from "@/lib/utils";

// Local-only notifications feed: we capture the 4 websocket events the
// backend already emits and keep the most recent ~20 in localStorage.
// "Unread" is tracked via a single `lastSeen` timestamp that advances
// when the user opens the dropdown — no backend persistence needed.

type NotificationKind =
  | "financial"
  | "event"
  | "budget"
  | "subscription";

interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number; // epoch ms
  href?: string;
}

const STORAGE_KEY = "bz_notifications_v1";
const SEEN_KEY = "bz_notifications_seen_v1";
const MAX_ITEMS = 20;

function loadStored(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Notification[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveStored(items: Notification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota errors etc. are non-fatal; just skip persistence.
  }
}

function loadSeen(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(SEEN_KEY);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function saveSeen(ts: number): void {
  try {
    localStorage.setItem(SEEN_KEY, String(ts));
  } catch {
    // Non-fatal.
  }
}

function formatRelative(ts: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 60) return t("justNow");
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return t("minutesAgo", { n: diffMin });
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return t("hoursAgo", { n: diffHr });
  const diffDay = Math.round(diffHr / 24);
  return t("daysAgo", { n: diffDay });
}

const KIND_ICON: Record<NotificationKind, typeof Calendar> = {
  financial: DollarSign,
  event: Calendar,
  budget: FileText,
  subscription: CreditCard,
};

const KIND_TINT: Record<NotificationKind, string> = {
  financial: "bg-success/10 text-success",
  event: "bg-info/10 text-info",
  budget: "bg-primary/10 text-primary",
  subscription: "bg-warning/10 text-warning",
};

export function NotificationsBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadStored());
    setLastSeen(loadSeen());
  }, []);

  const push = useCallback((n: Omit<Notification, "id" | "createdAt">) => {
    setItems((prev) => {
      const next: Notification = {
        ...n,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
      };
      const merged = [next, ...prev].slice(0, MAX_ITEMS);
      saveStored(merged);
      return merged;
    });
  }, []);

  // Subscribe to all 4 backend websocket events
  useWebSocketEvent("financial:created", (rec) => {
    const isIncome = rec.type === "income";
    const amount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(rec.amount) || 0);
    push({
      kind: "financial",
      title: isIncome ? t("incomeRecorded") : t("expenseRecorded"),
      body: `${rec.description ?? rec.category ?? ""} · ${amount}`.trim(),
      href: "/financial",
    });
  });

  useWebSocketEvent("event:created", (evt) => {
    push({
      kind: "event",
      title: t("eventCreated"),
      body: `${evt.title} · ${evt.event_date}`,
      href: "/calendar",
    });
  });

  useWebSocketEvent("budget:created", (bud) => {
    const amount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(bud.total_amount) || 0);
    push({
      kind: "budget",
      title: t("budgetCreated"),
      body: `${bud.client_name ?? bud.document_number ?? ""} · ${amount}`.trim(),
      href: "/documents",
    });
  });

  useWebSocketEvent("subscription:updated", (sub) => {
    push({
      kind: "subscription",
      title: t("subscriptionUpdated"),
      body: t("statusLabel", { status: sub.status }),
      href: "/profile",
    });
  });

  // Outside-click + Escape close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unreadCount = useMemo(
    () => items.filter((i) => i.createdAt > lastSeen).length,
    [items, lastSeen],
  );

  const handleOpen = () => {
    setOpen((v) => {
      const next = !v;
      // Mark all read when the dropdown opens
      if (next) {
        const now = Date.now();
        setLastSeen(now);
        saveSeen(now);
      }
      return next;
    });
  };

  const handleClear = () => {
    setItems([]);
    saveStored([]);
  };

  const handleClick = (n: Notification) => {
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        aria-label={t("title")}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-background"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border bg-background/40 px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("title")}
            </h3>
            {items.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
              >
                {t("clear")}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                <Bell className="h-6 w-6 text-text-muted" />
              </div>
              <p className="mt-3 text-sm font-medium text-text-secondary">
                {t("emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-text-muted">{t("emptyHint")}</p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto divide-y divide-border/30">
              {items.map((n) => {
                const Icon = KIND_ICON[n.kind];
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background",
                        n.createdAt > lastSeen && "bg-primary/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          KIND_TINT[n.kind],
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="truncate text-xs text-text-secondary">
                            {n.body}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-text-muted">
                          {formatRelative(n.createdAt, t)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
