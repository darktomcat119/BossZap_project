'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Payment, PaymentStatus, RevenueDataPoint } from '@/lib/types';

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

const mockFailedPayments: Payment[] = [
  { id: 'f1', subscriberName: 'Carlos Mendez', amount: 89, status: 'failed', method: 'credit_card', date: '2026-03-24', recoveryStatus: 'pending' },
  { id: 'f2', subscriberName: 'Roberto Lima', amount: 29, status: 'failed', method: 'pix', date: '2026-03-23', recoveryStatus: 'recovered' },
  { id: 'f3', subscriberName: 'Camila Rojas', amount: 29, status: 'failed', method: 'credit_card', date: '2026-03-21', recoveryStatus: 'abandoned' },
];

const mockPayments: Payment[] = [
  { id: 'p1', subscriberName: 'Ana Silva', amount: 199, status: 'paid', method: 'credit_card', date: '2026-03-24' },
  { id: 'p2', subscriberName: 'Laura Hernández', amount: 199, status: 'paid', method: 'bank_transfer', date: '2026-03-24' },
  { id: 'p3', subscriberName: 'Diego Ferreira', amount: 89, status: 'paid', method: 'pix', date: '2026-03-24' },
  { id: 'p4', subscriberName: 'Carlos Mendez', amount: 89, status: 'failed', method: 'credit_card', date: '2026-03-24' },
  { id: 'p5', subscriberName: 'María García', amount: 89, status: 'paid', method: 'credit_card', date: '2026-03-23' },
  { id: 'p6', subscriberName: 'Fernando Oliveira', amount: 89, status: 'paid', method: 'pix', date: '2026-03-23' },
  { id: 'p7', subscriberName: 'Roberto Lima', amount: 29, status: 'refunded', method: 'pix', date: '2026-03-22' },
  { id: 'p8', subscriberName: 'Valentina López', amount: 199, status: 'paid', method: 'credit_card', date: '2026-03-22' },
  { id: 'p9', subscriberName: 'Isabela Martínez', amount: 89, status: 'paid', method: 'credit_card', date: '2026-03-21' },
  { id: 'p10', subscriberName: 'Bruno Costa', amount: 29, status: 'paid', method: 'bank_transfer', date: '2026-03-20' },
];

const paymentStatusColors: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const recoveryColors: Record<string, string> = {
  recovered: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  abandoned: 'bg-red-100 text-red-700',
};

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const tc = useTranslations('common');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const methodLabel = (method: string) => {
    const map: Record<string, string> = {
      credit_card: t('creditCard'),
      bank_transfer: t('bankTransfer'),
      pix: t('pix'),
    };
    return map[method] ?? method;
  };

  const filteredPayments = useMemo(() => {
    if (statusFilter === 'all') return mockPayments;
    return mockPayments.filter((p) => p.status === statusFilter);
  }, [statusFilter]);

  const summaryCards = [
    { label: t('revenueToday'), value: '$487', icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: t('revenueWeek'), value: '$3,240', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: t('revenueMonth'), value: '$11,200', icon: Calendar, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <AdminShell>
      <div className="p-md lg:p-lg space-y-lg">
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-surface rounded-card border border-border p-md flex items-center gap-md">
                <div className={`w-12 h-12 rounded-button flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-caption text-text-secondary">{card.label}</p>
                  <p className="text-h3 font-bold text-text-primary">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue trend chart */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('revenueTrend')}</h2>
          <RevenueChart data={revenueData} />
        </div>

        {/* Failed payments */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('failedPayments')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('subscriber')}</th>
                  <th className="text-right px-md py-sm font-medium text-text-secondary">{t('amount')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('method')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{tc('date')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('recoveryStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {mockFailedPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-md py-sm text-text-primary">{p.subscriberName}</td>
                    <td className="px-md py-sm text-right text-text-primary">${p.amount}</td>
                    <td className="px-md py-sm text-text-secondary">{methodLabel(p.method)}</td>
                    <td className="px-md py-sm text-text-secondary">{p.date}</td>
                    <td className="px-md py-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', recoveryColors[p.recoveryStatus!])}>
                        {t(p.recoveryStatus === 'pending' ? 'pendingRecovery' : p.recoveryStatus!)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment history */}
        <div className="bg-surface rounded-card border border-border p-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm mb-md">
            <h2 className="text-h4 font-semibold text-text-primary">{t('paymentHistory')}</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-button border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">{tc('all')}</option>
              <option value="paid">{t('paid')}</option>
              <option value="failed">{t('failed')}</option>
              <option value="refunded">{t('refunded')}</option>
            </select>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('subscriber')}</th>
                  <th className="text-right px-md py-sm font-medium text-text-secondary">{t('amount')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{tc('status')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('method')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{tc('date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-md py-sm text-text-primary">{p.subscriberName}</td>
                    <td className="px-md py-sm text-right text-text-primary">${p.amount}</td>
                    <td className="px-md py-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', paymentStatusColors[p.status])}>
                        {t(p.status)}
                      </span>
                    </td>
                    <td className="px-md py-sm text-text-secondary">{methodLabel(p.method)}</td>
                    <td className="px-md py-sm text-text-secondary">{p.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-sm">
            {filteredPayments.map((p) => (
              <div key={p.id} className="p-sm rounded-button border border-border bg-background">
                <div className="flex items-center justify-between mb-xs">
                  <p className="font-medium text-text-primary">{p.subscriberName}</p>
                  <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', paymentStatusColors[p.status])}>
                    {t(p.status)}
                  </span>
                </div>
                <div className="flex justify-between text-caption text-text-secondary">
                  <span>${p.amount}</span>
                  <span>{methodLabel(p.method)}</span>
                  <span>{p.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
