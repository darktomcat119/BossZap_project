'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Database, Server, MessageSquare, Brain, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { healthApi } from '@/lib/api';
import { formatServiceStatus, formatWorkerState } from '@/lib/format';
import type { ServiceHealth, ServiceStatus, QueueMetrics, WorkerInfo, WorkerState, FailedJob } from '@/lib/types';

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
  const [failedJobs, setFailedJobs] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusRaw, queueRaw, workerRaw, failedRaw] = await Promise.all([
        healthApi.status(),
        healthApi.queues().catch(() => null),
        healthApi.workers().catch(() => []),
        healthApi.failedJobs().catch(() => []),
      ]);
      const statusData = extract(statusRaw) as ServiceHealth[] | Record<string, unknown>;
      const queueData = extract(queueRaw) as QueueMetrics | null;
      const workerData = extract(workerRaw) as WorkerInfo[];
      const failedData = extract(failedRaw) as FailedJob[];
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
      setFailedJobs(Array.isArray(failedData) ? failedData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCleanFailed = useCallback(async () => {
    if (!confirm(t('confirmCleanFailed'))) return;
    setCleaning(true);
    try {
      const res = (await healthApi.cleanFailedJobs()) as { removed?: number } | { data?: { removed?: number } };
      const removed =
        (res as { removed?: number }).removed ??
        (res as { data?: { removed?: number } }).data?.removed ??
        0;
      toast.success(t('cleanedJobs', { count: removed }));
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('cleanFailedError'));
    } finally {
      setCleaning(false);
    }
  }, [fetchData, t]);

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
          {tc('retry') ?? 'Tentar novamente'}
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
                        {formatServiceStatus(service.status)}
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
            {t('noServiceData')}
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
                            {formatWorkerState(worker.state)}
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
                        {formatWorkerState(worker.state)}
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

      {/* Failed jobs */}
      <div className="bg-surface rounded-card border border-border p-md">
        <div className="flex items-center justify-between mb-md gap-sm flex-wrap">
          <div className="flex items-center gap-sm">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-h4 font-semibold text-text-primary">{t('failedJobsTitle')}</h2>
            {failedJobs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-caption font-medium">
                {failedJobs.length}
              </span>
            )}
          </div>
          {failedJobs.length > 0 && (
            <button
              onClick={handleCleanFailed}
              disabled={cleaning || loading}
              className="flex items-center gap-xs px-3 py-1.5 rounded-button bg-red-600 text-white text-caption font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className={cn('w-3.5 h-3.5', cleaning && 'animate-pulse')} />
              {cleaning ? t('cleaning') : t('cleanAll')}
            </button>
          )}
        </div>

        {loading ? (
          <TableSkeleton />
        ) : failedJobs.length === 0 ? (
          <p className="text-body text-text-secondary py-md text-center">{t('noFailedJobs')}</p>
        ) : (
          <div className="space-y-xs">
            {failedJobs.map((job) => (
              <div key={`${job.queue}-${job.id}`} className="p-sm rounded-button border border-red-100 bg-red-50/30">
                <div className="flex items-center justify-between gap-sm flex-wrap mb-xs">
                  <div className="flex items-center gap-xs">
                    <span className="font-mono text-caption font-medium text-text-primary">{job.queue}</span>
                    <span className="text-caption text-text-secondary">•</span>
                    <span className="text-caption text-text-secondary">{job.name}</span>
                    <span className="text-caption text-text-secondary">•</span>
                    <span className="text-caption text-text-secondary">{job.attemptsMade} {t('attemptsLabel')}</span>
                  </div>
                  <span className="text-caption text-text-secondary">
                    {new Date(job.failed_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-caption text-red-700 font-mono break-all">{job.failedReason}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
