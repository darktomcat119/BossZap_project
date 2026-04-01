'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare, Cpu, FileText, DollarSign, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { metricsApi } from '@/lib/api';
import type {
  MetricsOverview,
  UsageStatsResult,
  TopSubscriberUsage,
  UsageMetric,
  CostBreakdown,
} from '@/lib/types';

const extract = (res: any) => res?.data ?? res;

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
        <div key={i} className="h-8 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function MetricsPage() {
  const t = useTranslations('metrics');

  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [topSubscribers, setTopSubscribers] = useState<TopSubscriberUsage[]>([]);
  const [usageData, setUsageData] = useState<UsageMetric[]>([]);
  const [costs, setCosts] = useState<CostBreakdown | null>(null);
  const [totalMessages, setTotalMessages] = useState(0);
  const [totalAiCalls, setTotalAiCalls] = useState(0);
  const [totalBudgets, setTotalBudgets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRaw, usageRaw, topRaw, costsRaw] = await Promise.all([
        metricsApi.overview(),
        metricsApi.usage().catch(() => null),
        metricsApi.topSubscribers().catch(() => null),
        metricsApi.costs().catch(() => null),
      ]);
      const ov = extract(ovRaw) as MetricsOverview;
      const usage = extract(usageRaw) as UsageStatsResult | UsageMetric[] | null;
      const top = extract(topRaw) as TopSubscriberUsage[] | null;
      const costsData = extract(costsRaw) as CostBreakdown | null;

      setOverview(ov);

      // Usage may be an array of time-series or a stats object
      if (Array.isArray(usage)) {
        setUsageData(usage);
      } else if (usage && 'totalMessages' in usage) {
        setTotalMessages(usage.totalMessages ?? 0);
        setTotalAiCalls(usage.totalAiCalls ?? 0);
        setTotalBudgets(usage.totalBudgets ?? 0);
        setUsageData([]);
      }

      setTopSubscribers(Array.isArray(top) ? top : top && Array.isArray((top as any).topSubscribers) ? (top as any).topSubscribers : []);
      setCosts(costsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (error) {
    return (
      <div className="p-md lg:p-lg flex flex-col items-center justify-center gap-md min-h-[50vh]">
        <p className="text-body text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-xs px-4 py-2 rounded-button bg-primary text-white text-body font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const stats = overview
    ? [
        { label: t('totalMessages'), value: totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
        { label: t('totalAiCalls'), value: totalAiCalls.toLocaleString(), icon: Cpu, color: 'text-purple-600 bg-purple-50' },
        { label: t('totalPdfs'), value: totalBudgets.toLocaleString(), icon: FileText, color: 'text-amber-600 bg-amber-50' },
      ]
    : [];

  const totalCost = costs ? costs.openai + costs.storage + costs.whatsapp : 0;

  return (
    <div className="p-md lg:p-lg space-y-lg">
      <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-surface rounded-card border border-border p-md flex items-center gap-md">
                  <div className={`w-12 h-12 rounded-button flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-caption text-text-secondary">{stat.label}</p>
                    <p className="text-h3 font-bold text-text-primary">{stat.value}</p>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Usage trend chart */}
      {usageData.length > 0 && (
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('usageTrend')}</h2>
          {loading ? (
            <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={usageData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Area type="monotone" dataKey="messages" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
        {/* Top subscribers */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('topSubscribers')}</h2>
          {loading ? (
            <TableSkeleton />
          ) : topSubscribers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-md py-sm font-medium text-text-secondary">#</th>
                    <th className="text-left px-md py-sm font-medium text-text-secondary">{t('subscriber')}</th>
                    <th className="text-right px-md py-sm font-medium text-text-secondary">{t('messageCount')}</th>
                    <th className="text-right px-md py-sm font-medium text-text-secondary">{t('aiCalls')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topSubscribers.map((sub, i) => (
                    <tr key={sub.subscriber_id} className="border-b border-border last:border-0">
                      <td className="px-md py-sm text-text-secondary">{i + 1}</td>
                      <td className="px-md py-sm text-text-primary font-medium">{sub.business_name ?? sub.subscriber_id}</td>
                      <td className="px-md py-sm text-right text-text-secondary">{sub.total_messages.toLocaleString()}</td>
                      <td className="px-md py-sm text-right text-text-secondary">{sub.total_ai_calls.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-body text-text-secondary py-md text-center">No data available</p>
          )}
        </div>

        {/* Cost breakdown */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('costBreakdown')}</h2>
          {loading ? (
            <TableSkeleton />
          ) : costs && totalCost > 0 ? (
            <div className="space-y-md">
              {[
                { label: t('openaiCost'), value: costs.openai, color: 'bg-purple-500' },
                { label: t('storageCost'), value: costs.storage, color: 'bg-blue-500' },
                { label: t('whatsappCost'), value: costs.whatsapp, color: 'bg-green-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-body mb-xs">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="font-medium text-text-primary">${item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${(item.value / totalCost) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-md border-t border-border flex justify-between">
                <span className="text-body font-semibold text-text-primary flex items-center gap-xs">
                  <DollarSign className="w-4 h-4" />
                  {t('totalCost')}
                </span>
                <span className="text-h4 font-bold text-text-primary">${totalCost.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-body text-text-secondary py-md text-center">No cost data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
