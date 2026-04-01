'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Users,
  UserCheck,
  DollarSign,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { GrowthChart } from '@/components/charts/growth-chart';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { metricsApi } from '@/lib/api';
import type {
  MetricsOverview,
  GrowthDataPoint,
  RevenueDataPoint,
} from '@/lib/types';

/* ── Helpers ── */

/**
 * The API may return `{ success: true, data: ... }` or the payload directly.
 * This helper normalises both shapes.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const extract = <T,>(res: any): T => (res?.data !== undefined ? res.data : res);

/* ── Skeleton components ── */

function CardSkeleton() {
  return (
    <div className="card-interactive flex items-center gap-md animate-pulse">
      <div className="w-12 h-12 rounded-card bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return <div className="h-[300px] bg-gray-100 rounded animate-pulse" />;
}

/* ── Page ── */

export default function OverviewPage() {
  const t = useTranslations('overview');

  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRaw, growthRaw, revenueRaw] = await Promise.all([
        metricsApi.overview(),
        metricsApi.growth(12),
        metricsApi.revenue(12),
      ]);

      setOverview(extract<MetricsOverview>(ovRaw));
      setGrowthData(extract<GrowthDataPoint[]>(growthRaw));
      setRevenueData(extract<RevenueDataPoint[]>(revenueRaw));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Error state ── */
  if (error) {
    return (
      <div className="p-md lg:p-xl flex flex-col items-center justify-center gap-md min-h-[50vh]">
        <p className="text-body text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('retry')}
        </button>
      </div>
    );
  }

  /* ── Stat cards definition ── */
  const cards = overview
    ? [
        {
          label: t('totalSubscribers'),
          value: overview.totalSubscribers.toLocaleString(),
          icon: Users,
          color: 'text-info',
          bg: 'bg-info/10',
        },
        {
          label: t('activeSubscribers'),
          value: overview.activeSubscribers.toLocaleString(),
          icon: UserCheck,
          color: 'text-success',
          bg: 'bg-success/10',
        },
        {
          label: t('monthlyRevenue'),
          value: `$${overview.revenueThisMonth.toLocaleString()}`,
          icon: DollarSign,
          color: 'text-secondary',
          bg: 'bg-secondary/10',
        },
        {
          label: t('messagesToday'),
          value: (overview as MetricsOverview & { messagesToday?: number })
            .messagesToday?.toLocaleString() ?? '-',
          icon: MessageSquare,
          color: 'text-primary',
          bg: 'bg-primary/10',
        },
      ]
    : [];

  return (
    <div className="p-md lg:p-xl space-y-lg">
      <h1 className="text-h1 font-bold text-text-primary">{t('title')}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : cards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="card-interactive flex items-center gap-md"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-card ${card.bg}`}
                  >
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-small text-text-secondary truncate">
                      {card.label}
                    </p>
                    <p className="text-h3 font-semibold text-text-primary">
                      {card.value}
                    </p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
        <div className="bg-surface rounded-card border border-border p-md">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-h4 font-semibold text-text-primary">
              {t('subscriberGrowth')}
            </h2>
            <span className="text-caption text-text-secondary">
              {t('last12Months')}
            </span>
          </div>
          {loading ? <ChartSkeleton /> : <GrowthChart data={growthData} />}
        </div>

        <div className="bg-surface rounded-card border border-border p-md">
          <div className="flex items-center justify-between mb-md">
            <h2 className="text-h4 font-semibold text-text-primary">
              {t('revenueTrend')}
            </h2>
            <span className="text-caption text-text-secondary">
              {t('last12Months')}
            </span>
          </div>
          {loading ? <ChartSkeleton /> : <RevenueChart data={revenueData} />}
        </div>
      </div>

      {/* Alerts panel */}
      <div className="bg-surface rounded-card border border-border p-md">
        <h2 className="text-h4 font-semibold text-text-primary mb-md">
          {t('recentAlerts')}
        </h2>
        <p className="text-body text-text-secondary py-md text-center">
          {t('noAlerts')}
        </p>
      </div>
    </div>
  );
}
