'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Database, Server, MessageSquare, Brain, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { healthApi } from '@/lib/api';
import type { ServiceHealth, ServiceStatus, QueueMetrics, WorkerInfo, WorkerState } from '@/lib/types';

const extract = (res: any) => res?.data ?? res;

const serviceIcons: Record<string, React.ElementType> = {
  database: Database,
  redis: Server,
  whatsappApi: MessageSquare,
  whatsapp: MessageSquare,
  openaiApi: Brain,
  openai: Brain,
};

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

function CardSkeleton() {
  return (
    <div className="rounded-card border border-border p-md animate-pulse bg-gray-50">
      <div className="h-6 w-6 bg-gray-200 rounded mb-sm" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 animate-pulse p-md">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded" />
      ))}
    </div>
  );
}

export default function HealthPage() {
  const t = useTranslations('health');
  const tc = useTranslations('common');

  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [queue, setQueue] = useState<QueueMetrics | null>(null);
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRaw, queueRaw, workerRaw] = await Promise.all([
        healthApi.status(),
        healthApi.queues().catch(() => null),
        healthApi.workers().catch(() => []),
      ]);
      const statusData = extract(statusRaw) as ServiceHealth[] | Record<string, unknown>;
      const queueData = extract(queueRaw) as QueueMetrics | null;
      const workerData = extract(workerRaw) as WorkerInfo[];
      // The health status endpoint may return an array or object with services
      if (Array.isArray(statusData)) {
        setServices(statusData);
      } else if (statusData && typeof statusData === 'object') {
        // Convert object shape to array if needed
        const arr: ServiceHealth[] = [];
        for (const [key, val] of Object.entries(statusData)) {
          if (typeof val === 'object' && val !== null && 'status' in val) {
            arr.push({ name: key, ...(val as Omit<ServiceHealth, 'name'>) });
          }
        }
        setServices(arr.length > 0 ? arr : []);
      }
      setQueue(queueData);
      setWorkers(Array.isArray(workerData) ? workerData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

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

  return (
    <div className="p-md lg:p-lg space-y-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-h2 font-bold text-text-primary">{t('title')}</h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-xs px-4 py-2 rounded-button border border-border bg-surface text-body text-text-secondary hover:bg-background transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          {tc('refresh')}
        </button>
      </div>

      {/* Service status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : services.map((service) => {
              const Icon = serviceIcons[service.name] ?? Server;
              const colors = statusColors[service.status] ?? statusColors.operational;
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
                        {service.status}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-body font-semibold text-text-primary">
                    {service.name}
                  </h3>
                  {service.latency !== undefined && (
                    <p className="text-caption text-text-secondary mt-xs">
                      {service.latency}ms
                    </p>
                  )}
                </div>
              );
            })}
        {!loading && services.length === 0 && (
          <div className="col-span-full p-lg text-center text-text-secondary">
            No service data available
          </div>
        )}
      </div>

      {/* Queue metrics */}
      {(loading || queue) && (
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('queueMetrics')}</h2>
          {loading ? (
            <TableSkeleton />
          ) : queue ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
              <div className="p-md rounded-button bg-background">
                <p className="text-caption text-text-secondary mb-xs">{t('queueDepth')}</p>
                <p className="text-h3 font-bold text-text-primary">{queue.depth}</p>
              </div>
              <div className="p-md rounded-button bg-background">
                <p className="text-caption text-text-secondary mb-xs">{t('processingRate')}</p>
                <p className="text-h3 font-bold text-text-primary">
                  {queue.processingRate} <span className="text-body font-normal text-text-secondary">{t('jobsPerMinute')}</span>
                </p>
              </div>
              <div className="p-md rounded-button bg-background">
                <p className="text-caption text-text-secondary mb-xs">{t('failedJobs')}</p>
                <p className="text-h3 font-bold text-red-600">{queue.failedJobs}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Worker status table */}
      {(loading || workers.length > 0) && (
        <div className="bg-surface rounded-card border border-border p-md">
          <h2 className="text-h4 font-semibold text-text-primary mb-md">{t('workerStatus')}</h2>

          {loading ? (
            <TableSkeleton />
          ) : (
            <>
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
                    {workers.map((worker) => (
                      <tr key={worker.name} className="border-b border-border last:border-0">
                        <td className="px-md py-sm font-medium text-text-primary font-mono text-caption">{worker.name}</td>
                        <td className="px-md py-sm">
                          <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', workerStateColors[worker.state] ?? 'bg-gray-100 text-gray-600')}>
                            {worker.state}
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
                {workers.map((worker) => (
                  <div key={worker.name} className="p-sm rounded-button border border-border bg-background">
                    <div className="flex items-center justify-between mb-xs">
                      <p className="font-mono text-caption font-medium text-text-primary">{worker.name}</p>
                      <span className={cn('px-2 py-0.5 rounded-full text-caption font-medium', workerStateColors[worker.state] ?? 'bg-gray-100 text-gray-600')}>
                        {worker.state}
                      </span>
                    </div>
                    <div className="flex justify-between text-caption text-text-secondary">
                      <span>{t('uptime')}: {worker.uptime}</span>
                      <span>{new Date(worker.lastHeartbeat).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
