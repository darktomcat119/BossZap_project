'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { RevenueChart } from '@/components/charts/revenue-chart';
import { DollarSign, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { paymentsApi, metricsApi } from '@/lib/api';
import { formatBRL, formatPaymentStatus } from '@/lib/format';
import type { Payment, PaymentSummary, RevenueDataPoint } from '@/lib/types';

const extract = (res: any) => res?.data ?? res;

const paymentStatusColors: Record<string, string> = {
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
};

const recoveryColors: Record<string, string> = {
  recovered: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  abandoned: 'bg-red-100 text-red-700',
};

function CardSkeleton() {
  return (
    <div className="bg-surface rounded-card border border-border p-md flex items-center gap-md animate-pulse">
      <div className="w-12 h-12 rounded-button bg-gray-200" />
      <div className="space-y-2">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-md">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const t = useTranslations('payments');
  const tc = useTranslations('common');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawPayments, rawSummary, rawRevenue] = await Promise.all([
        paymentsApi.list(),
        paymentsApi.summary(),
        metricsApi.revenue(),
      ]);
      const paymentList = extract(rawPayments);
      const summaryData = extract(rawSummary);
      const revData = extract(rawRevenue);
      setPayments(Array.isArray(paymentList) ? paymentList : []);
      setSummary(summaryData ?? null);
      setRevenueData(Array.isArray(revData) ? revData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const methodLabel = (method: string | undefined) => {
    if (!method) return '-';
    const map: Record<string, string> = {
      credit_card: t('creditCard'),
      bank_transfer: t('bankTransfer'),
      pix: t('pix'),
    };
    return map[method] ?? method;
  };

  const filteredPayments = useMemo(() => {
    if (statusFilter === 'all') return payments;
    return payments.filter((p) => p.status === statusFilter);
  }, [statusFilter, payments]);

  const failedPayments = useMemo(() => {
    return payments.filter((p) => p.status === 'failed');
  }, [payments]);

  if (error && !loading && payments.length === 0) {
    return (
      <div className="p-md lg:p-lg flex flex-col items-center justify-center gap-md min-h-[50vh]">
        <p className="text-body text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {tc('retry') ?? 'Retry'}
        </button>
      </div>
    );
  }

  const summaryCards = summary
    ? [
        { label: t('revenueToday'), value: formatBRL(summary.revenueToday), icon: DollarSign, color: 'text-green-600 bg-green-50' },
        { label: t('revenueWeek'), value: formatBRL(summary.revenueWeek), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
        { label: t('revenueMonth'), value: formatBRL(summary.revenueMonth), icon: Calendar, color: 'text-purple-600 bg-purple-50' },
      ]
    : [];

  return (
    <div className="p-md lg:p-lg space-y-lg">
      <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

      {error && payments.length > 0 && (
        <div className="p-sm rounded-button bg-red-50 text-red-600 text-body">{error}</div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : summaryCards.map((card) => {
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
        {loading ? (
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        ) : (
          <RevenueChart data={revenueData} />
        )}
      </div>

      {/* Failed payments */}
      {!loading && failedPayments.length > 0 && (
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
                {failedPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-md py-sm text-text-primary">{p.subscriber_name ?? '-'}</td>
                    <td className="px-md py-sm text-right text-text-primary">{formatBRL(p.amount)}</td>
                    <td className="px-md py-sm text-text-secondary">{methodLabel(p.method)}</td>
                    <td className="px-md py-sm text-text-secondary">{new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
                    <td className="px-md py-sm">
                      {p.recovery_status && (
                        <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', recoveryColors[p.recovery_status])}>
                          {p.recovery_status === 'pending' ? t('pendingRecovery') : t(p.recovery_status)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            <option value="succeeded">{t('paid')}</option>
            <option value="failed">{t('failed')}</option>
            <option value="refunded">{t('refunded')}</option>
          </select>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : (
          <>
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
                      <td className="px-md py-sm text-text-primary">{p.subscriber_name ?? '-'}</td>
                      <td className="px-md py-sm text-right text-text-primary">{formatBRL(p.amount)}</td>
                      <td className="px-md py-sm">
                        <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', paymentStatusColors[p.status] ?? 'bg-gray-100 text-gray-600')}>
                          {formatPaymentStatus(p.status)}
                        </span>
                      </td>
                      <td className="px-md py-sm text-text-secondary">{methodLabel(p.method)}</td>
                      <td className="px-md py-sm text-text-secondary">{new Date(p.paid_at || p.created_at).toLocaleDateString()}</td>
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
                    <p className="font-medium text-text-primary">{p.subscriber_name ?? '-'}</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', paymentStatusColors[p.status] ?? 'bg-gray-100 text-gray-600')}>
                      {formatPaymentStatus(p.status)}
                    </span>
                  </div>
                  <div className="flex justify-between text-caption text-text-secondary">
                    <span>{formatBRL(p.amount)}</span>
                    <span>{methodLabel(p.method)}</span>
                    <span>{new Date(p.paid_at || p.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {filteredPayments.length === 0 && (
              <div className="p-lg text-center text-text-secondary">{tc('noResults')}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
