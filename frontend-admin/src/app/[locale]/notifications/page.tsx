'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ChevronRight,
  BellOff,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { notificationsApi } from '@/lib/api';
import type { AdminNotification, NotificationSeverity } from '@/lib/types';

const extract = (res: unknown): AdminNotification[] => {
  const r = res as { data?: AdminNotification[] } | AdminNotification[];
  if (Array.isArray(r)) return r;
  return Array.isArray(r?.data) ? r.data : [];
};

const severityIconConfig: Record<
  NotificationSeverity,
  { icon: typeof Info; bg: string; text: string; ring: string }
> = {
  critical: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    text: 'text-red-600',
    ring: 'ring-red-200',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-200',
  },
};

function CardSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-border p-md animate-pulse">
      <div className="flex gap-md">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-2/3 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | NotificationSeverity>('all');

  const FILTERS: Array<{ key: 'all' | NotificationSeverity; label: string }> = [
    { key: 'all', label: t('all') },
    { key: 'critical', label: t('filterCritical') },
    { key: 'warning', label: t('filterWarning') },
    { key: 'info', label: t('filterInfo') },
  ];

  const severityLabel = (s: NotificationSeverity): string => {
    if (s === 'critical') return t('labelCritical');
    if (s === 'warning') return t('labelWarning');
    return t('labelInfo');
  };

  const relativeTime = (iso: string): string => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) return t('now');
    if (minutes < 60) return `${minutes} ${t('minAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${t('hoursAgo')}`;
    const days = Math.floor(hours / 24);
    return `${days} ${t('daysAgo')}`;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await notificationsApi.list();
      setItems(extract(raw));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = filter === 'all' ? items : items.filter((n) => n.severity === filter);

  const counts = items.reduce(
    (acc, n) => {
      acc[n.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, info: 0 } as Record<NotificationSeverity, number>,
  );

  return (
    <div className="p-md lg:p-lg space-y-md">
      <div className="flex items-center justify-between gap-sm">
        <div>
          <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
          <p className="text-caption text-text-secondary mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-xs px-4 py-2 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {t('refresh')}
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-xs">
        {FILTERS.map((f) => {
          const count =
            f.key === 'all' ? items.length : counts[f.key as NotificationSeverity] ?? 0;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-caption font-medium transition-colors border',
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface text-text-secondary border-border hover:bg-background',
              )}
            >
              {f.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-surface rounded-card border border-red-200 p-md text-red-600 text-body">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-sm">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-surface rounded-card border border-border p-xl flex flex-col items-center justify-center gap-sm">
            <BellOff className="w-10 h-10 text-text-secondary/40" />
            <p className="text-body text-text-secondary">{t('empty')}</p>
            <p className="text-caption text-text-secondary/70">{t('emptyHint')}</p>
          </div>
        ) : (
          filtered.map((n) => {
            const cfg = severityIconConfig[n.severity];
            const Icon = cfg.icon;
            const Inner = (
              <div className="flex items-start gap-md">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-1',
                    cfg.bg,
                    cfg.ring,
                  )}
                >
                  <Icon className={cn('w-5 h-5', cfg.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-xs flex-wrap">
                    <h3 className="text-body font-semibold text-text-primary">
                      {n.title}
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] font-medium',
                        cfg.bg,
                        cfg.text,
                      )}
                    >
                      {severityLabel(n.severity)}
                    </span>
                  </div>
                  <p className="text-body text-text-secondary mt-0.5">{n.message}</p>
                  <p className="text-caption text-text-secondary/70 mt-1">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
                {n.link && (
                  <ChevronRight className="w-4 h-4 text-text-secondary shrink-0 mt-2" />
                )}
              </div>
            );

            return n.link ? (
              <Link
                key={n.id}
                href={n.link}
                className="block bg-surface rounded-card border border-border p-md hover:bg-background transition-colors"
              >
                {Inner}
              </Link>
            ) : (
              <div
                key={n.id}
                className="bg-surface rounded-card border border-border p-md"
              >
                {Inner}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
