'use client';

import { useTranslations } from 'next-intl';
import {
  Users,
  UserCheck,
  DollarSign,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import { GrowthChart } from '@/components/charts/growth-chart';
import { RevenueChart } from '@/components/charts/revenue-chart';
import type { GrowthDataPoint, RevenueDataPoint, Alert } from '@/lib/types';

const growthData: GrowthDataPoint[] = [
  { month: 'Apr', subscribers: 42 },
  { month: 'May', subscribers: 58 },
  { month: 'Jun', subscribers: 71 },
  { month: 'Jul', subscribers: 89 },
  { month: 'Aug', subscribers: 104 },
  { month: 'Sep', subscribers: 128 },
  { month: 'Oct', subscribers: 145 },
  { month: 'Nov', subscribers: 163 },
  { month: 'Dec', subscribers: 178 },
  { month: 'Jan', subscribers: 195 },
  { month: 'Feb', subscribers: 207 },
  { month: 'Mar', subscribers: 214 },
];

const revenueData: RevenueDataPoint[] = [
  { month: 'Apr', revenue: 3200 },
  { month: 'May', revenue: 4100 },
  { month: 'Jun', revenue: 4800 },
  { month: 'Jul', revenue: 5500 },
  { month: 'Aug', revenue: 6200 },
  { month: 'Sep', revenue: 7100 },
  { month: 'Oct', revenue: 7800 },
  { month: 'Nov', revenue: 8400 },
  { month: 'Dec', revenue: 9100 },
  { month: 'Jan', revenue: 9800 },
  { month: 'Feb', revenue: 10500 },
  { month: 'Mar', revenue: 11200 },
];

const mockAlerts: Alert[] = [
  { id: 'a1', type: 'payment_failed', name: 'Carlos Mendez', timestamp: '2026-03-24T14:30:00Z' },
  { id: 'a2', type: 'limit_warning', name: 'Laura Hernandez', percent: 92, timestamp: '2026-03-24T13:15:00Z' },
  { id: 'a3', type: 'payment_failed', name: 'Roberto Lima', timestamp: '2026-03-24T11:00:00Z' },
  { id: 'a4', type: 'limit_warning', name: 'Diego Ferreira', percent: 87, timestamp: '2026-03-24T09:45:00Z' },
];

export default function OverviewPage() {
  const t = useTranslations('overview');

  const cards = [
    {
      label: t('totalSubscribers'),
      value: '214',
      icon: Users,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: t('activeSubscribers'),
      value: '187',
      icon: UserCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: t('monthlyRevenue'),
      value: '$11,200',
      icon: DollarSign,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      label: t('messagesToday'),
      value: '1,842',
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <AdminShell>
      <div className="p-md lg:p-xl space-y-lg">
        <h1 className="text-h1 font-bold text-text-primary">
          {t('title')}
        </h1>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
          {cards.map((card) => {
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
          {/* Growth chart */}
          <div className="bg-surface rounded-card border border-border p-md">
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-h4 font-semibold text-text-primary">
                {t('subscriberGrowth')}
              </h2>
              <span className="text-caption text-text-secondary">{t('last12Months')}</span>
            </div>
            <GrowthChart data={growthData} />
          </div>

          {/* Revenue chart */}
          <div className="bg-surface rounded-card border border-border p-md">
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-h4 font-semibold text-text-primary">
                {t('revenueTrend')}
              </h2>
              <span className="text-caption text-text-secondary">{t('last12Months')}</span>
            </div>
            <RevenueChart data={revenueData} />
          </div>
        </div>

        {/* Alerts panel */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">
            {t('recentAlerts')}
          </h2>
          {mockAlerts.length === 0 ? (
            <p className="text-body text-text-secondary py-md text-center">
              {t('noAlerts')}
            </p>
          ) : (
            <div className="space-y-sm">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-sm p-sm rounded-button border border-border bg-background"
                >
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    alert.type === 'payment_failed'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary">
                      {alert.type === 'payment_failed'
                        ? t('paymentFailed', { name: alert.name })
                        : t('limitWarning', { name: alert.name, percent: alert.percent })}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
