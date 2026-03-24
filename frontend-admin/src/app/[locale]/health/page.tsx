'use client';

import { useTranslations } from 'next-intl';
import { AdminShell } from '@/components/layout/admin-shell';
import { Database, Server, MessageSquare, Brain, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceHealth, ServiceStatus, QueueMetrics, WorkerInfo, WorkerState } from '@/lib/types';

const mockServices: (ServiceHealth & { icon: React.ElementType })[] = [
  { name: 'database', status: 'operational', latency: 12, icon: Database },
  { name: 'redis', status: 'operational', latency: 3, icon: Server },
  { name: 'whatsappApi', status: 'degraded', latency: 450, icon: MessageSquare },
  { name: 'openaiApi', status: 'operational', latency: 180, icon: Brain },
];

const mockQueue: QueueMetrics = {
  depth: 142,
  processingRate: 38,
  failedJobs: 7,
};

const mockWorkers: WorkerInfo[] = [
  { name: 'message-worker-01', state: 'running', uptime: '4d 12h 33m', lastHeartbeat: '2026-03-24T14:32:10Z' },
  { name: 'message-worker-02', state: 'running', uptime: '4d 12h 33m', lastHeartbeat: '2026-03-24T14:32:08Z' },
  { name: 'ai-worker-01', state: 'running', uptime: '2d 8h 15m', lastHeartbeat: '2026-03-24T14:32:05Z' },
  { name: 'pdf-worker-01', state: 'idle', uptime: '4d 12h 33m', lastHeartbeat: '2026-03-24T14:31:45Z' },
  { name: 'notification-worker-01', state: 'stopped', uptime: '0m', lastHeartbeat: '2026-03-24T10:15:00Z' },
];

const statusColors: Record<ServiceStatus, { bg: string; dot: string; text: string }> = {
  operational: { bg: 'bg-green-50', dot: 'bg-green-500', text: 'text-green-700' },
  degraded: { bg: 'bg-amber-50', dot: 'bg-amber-500', text: 'text-amber-700' },
  down: { bg: 'bg-red-50', dot: 'bg-red-500', text: 'text-red-700' },
};

const workerStateColors: Record<WorkerState, string> = {
  running: 'bg-green-100 text-green-700',
  idle: 'bg-amber-100 text-amber-700',
  stopped: 'bg-red-100 text-red-700',
};

export default function HealthPage() {
  const t = useTranslations('health');
  const tc = useTranslations('common');

  return (
    <AdminShell>
      <div className="p-md lg:p-lg space-y-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
          <button className="flex items-center gap-xs px-4 py-2 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors">
            <RefreshCw className="w-4 h-4" />
            {tc('refresh')}
          </button>
        </div>

        {/* Service status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
          {mockServices.map((service) => {
            const Icon = service.icon;
            const colors = statusColors[service.status];
            return (
              <div
                key={service.name}
                className={cn('rounded-card border border-border p-md', colors.bg)}
              >
                <div className="flex items-center justify-between mb-sm">
                  <Icon className="w-6 h-6 text-text-primary" />
                  <div className="flex items-center gap-xs">
                    <div className={cn('w-2.5 h-2.5 rounded-full', colors.dot)} />
                    <span className={cn('text-caption font-medium', colors.text)}>
                      {t(service.status)}
                    </span>
                  </div>
                </div>
                <h3 className="text-body font-semibold text-text-primary">
                  {t(service.name as 'database' | 'redis' | 'whatsappApi' | 'openaiApi')}
                </h3>
                {service.latency !== undefined && (
                  <p className="text-caption text-text-secondary mt-xs">
                    {service.latency}ms
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Queue metrics */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('queueMetrics')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div className="p-md rounded-button bg-background">
              <p className="text-caption text-text-secondary mb-xs">{t('queueDepth')}</p>
              <p className="text-h3 font-bold text-text-primary">{mockQueue.depth}</p>
            </div>
            <div className="p-md rounded-button bg-background">
              <p className="text-caption text-text-secondary mb-xs">{t('processingRate')}</p>
              <p className="text-h3 font-bold text-text-primary">
                {mockQueue.processingRate} <span className="text-body font-normal text-text-secondary">{t('jobsPerMinute')}</span>
              </p>
            </div>
            <div className="p-md rounded-button bg-background">
              <p className="text-caption text-text-secondary mb-xs">{t('failedJobs')}</p>
              <p className="text-h3 font-bold text-red-600">{mockQueue.failedJobs}</p>
            </div>
          </div>
        </div>

        {/* Worker status table */}
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('workerStatus')}</h2>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('workerName')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('workerState')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('uptime')}</th>
                  <th className="text-left px-md py-sm font-medium text-text-secondary">{t('lastHeartbeat')}</th>
                </tr>
              </thead>
              <tbody>
                {mockWorkers.map((worker) => (
                  <tr key={worker.name} className="border-b border-border last:border-0">
                    <td className="px-md py-sm font-medium text-text-primary font-mono text-caption">{worker.name}</td>
                    <td className="px-md py-sm">
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', workerStateColors[worker.state])}>
                        {t(worker.state)}
                      </span>
                    </td>
                    <td className="px-md py-sm text-text-secondary">{worker.uptime}</td>
                    <td className="px-md py-sm text-text-secondary text-caption">
                      {new Date(worker.lastHeartbeat).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-sm">
            {mockWorkers.map((worker) => (
              <div key={worker.name} className="p-sm rounded-button border border-border bg-background">
                <div className="flex items-center justify-between mb-xs">
                  <p className="font-mono text-caption font-medium text-text-primary">{worker.name}</p>
                  <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', workerStateColors[worker.state])}>
                    {t(worker.state)}
                  </span>
                </div>
                <div className="flex justify-between text-caption text-text-secondary">
                  <span>{t('uptime')}: {worker.uptime}</span>
                  <span>{new Date(worker.lastHeartbeat).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
