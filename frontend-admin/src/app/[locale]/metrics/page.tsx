'use client';

import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { MessageSquare, Cpu, FileText, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { UsageMetric, TopSubscriber, CostBreakdown } from '@/lib/types';

const usageData: UsageMetric[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 1, 23 + i);
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    messages: Math.floor(800 + Math.random() * 1200),
    aiCalls: Math.floor(200 + Math.random() * 400),
    pdfs: Math.floor(20 + Math.random() * 80),
  };
});

const topSubscribers: TopSubscriber[] = [
  { name: 'Laura Hernández', messages: 5600, aiCalls: 1200, pdfs: 340 },
  { name: 'Valentina López', messages: 4200, aiCalls: 980, pdfs: 280 },
  { name: 'Ana Silva', messages: 3420, aiCalls: 810, pdfs: 195 },
  { name: 'Diego Ferreira', messages: 2100, aiCalls: 540, pdfs: 120 },
  { name: 'Fernando Oliveira', messages: 1800, aiCalls: 420, pdfs: 95 },
  { name: 'Carlos Mendez', messages: 1240, aiCalls: 310, pdfs: 78 },
  { name: 'Isabela Martínez', messages: 960, aiCalls: 240, pdfs: 62 },
  { name: 'María García', messages: 890, aiCalls: 210, pdfs: 55 },
  { name: 'Pedro Santos', messages: 450, aiCalls: 95, pdfs: 28 },
  { name: 'Roberto Lima', messages: 320, aiCalls: 70, pdfs: 18 },
];

const costs: CostBreakdown = {
  openai: 2840,
  storage: 420,
  whatsapp: 1560,
};

const totalMessages = usageData.reduce((s, d) => s + d.messages, 0);
const totalAi = usageData.reduce((s, d) => s + d.aiCalls, 0);
const totalPdfs = usageData.reduce((s, d) => s + d.pdfs, 0);

export default function MetricsPage() {
  const t = useTranslations('metrics');

  const stats = [
    { label: t('totalMessages'), value: totalMessages.toLocaleString(), icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
    { label: t('totalAiCalls'), value: totalAi.toLocaleString(), icon: Cpu, color: 'text-purple-600 bg-purple-50' },
    { label: t('totalPdfs'), value: totalPdfs.toLocaleString(), icon: FileText, color: 'text-amber-600 bg-amber-50' },
  ];

  const totalCost = costs.openai + costs.storage + costs.whatsapp;

  return (
    <AdminShell>
      <div className="p-md lg:p-lg space-y-lg">
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          {stats.map((stat) => {
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
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('usageTrend')}</h2>
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-md">
          {/* Top subscribers */}
          <div className="bg-surface rounded-card border border-border p-md">
            <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('topSubscribers')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-body">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-md py-sm font-medium text-text-secondary">#</th>
                    <th className="text-left px-md py-sm font-medium text-text-secondary">{t('subscriber')}</th>
                    <th className="text-right px-md py-sm font-medium text-text-secondary">{t('messageCount')}</th>
                    <th className="text-right px-md py-sm font-medium text-text-secondary">{t('aiCalls')}</th>
                    <th className="text-right px-md py-sm font-medium text-text-secondary">{t('pdfs')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topSubscribers.map((sub, i) => (
                    <tr key={sub.name} className="border-b border-border last:border-0">
                      <td className="px-md py-sm text-text-secondary">{i + 1}</td>
                      <td className="px-md py-sm text-text-primary font-medium">{sub.name}</td>
                      <td className="px-md py-sm text-right text-text-secondary">{sub.messages.toLocaleString()}</td>
                      <td className="px-md py-sm text-right text-text-secondary">{sub.aiCalls.toLocaleString()}</td>
                      <td className="px-md py-sm text-right text-text-secondary">{sub.pdfs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-surface rounded-card border border-border p-md">
            <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('costBreakdown')}</h2>
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
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
