import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue/constants';

interface ServiceHealth {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}

interface QueueMetricsResult {
  depth: number;
  processingRate: number;
  failedJobs: number;
}

interface WorkerInfoResult {
  name: string;
  state: 'running' | 'idle' | 'stopped';
  uptime: string;
  lastHeartbeat: string;
}

interface FailedJobResult {
  id: string;
  queue: string;
  name: string;
  failedReason: string;
  attemptsMade: number;
  failed_at: string;
}

@Injectable()
export class AdminHealthService {
  private readonly logger = new Logger(AdminHealthService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_INBOUND)
    private readonly inboundQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_OUTBOUND)
    private readonly outboundQueue: Queue,
  ) {}

  async getServices(): Promise<ServiceHealth[]> {
    const [db, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return [
      { name: 'database', ...db },
      { name: 'redis', ...redis },
      {
        name: 'whatsapp',
        status:
          process.env.WABA_ACCESS_TOKEN && process.env.WABA_PHONE_NUMBER_ID
            ? 'operational'
            : 'degraded',
      },
      {
        name: 'openai',
        status: process.env.OPENAI_API_KEY ? 'operational' : 'degraded',
      },
    ];
  }

  async getQueueMetrics(): Promise<QueueMetricsResult> {
    try {
      const [inbound, outbound] = await Promise.all([
        this.inboundQueue.getJobCounts('waiting', 'active', 'failed'),
        this.outboundQueue.getJobCounts('waiting', 'active', 'failed'),
      ]);

      return {
        depth: (inbound.waiting ?? 0) + (outbound.waiting ?? 0),
        processingRate: (inbound.active ?? 0) + (outbound.active ?? 0),
        failedJobs: (inbound.failed ?? 0) + (outbound.failed ?? 0),
      };
    } catch (err) {
      this.logger.warn(`Queue metrics unavailable: ${(err as Error).message}`);
      return { depth: 0, processingRate: 0, failedJobs: 0 };
    }
  }

  async getFailedJobs(limit = 20): Promise<FailedJobResult[]> {
    try {
      const [inboundJobs, outboundJobs] = await Promise.all([
        this.inboundQueue.getFailed(0, limit - 1),
        this.outboundQueue.getFailed(0, limit - 1),
      ]);

      const map = (job: unknown, queue: string): FailedJobResult => {
        const j = job as {
          id?: string;
          name?: string;
          failedReason?: string;
          attemptsMade?: number;
          timestamp?: number;
          finishedOn?: number;
        };
        return {
          id: String(j.id ?? ''),
          queue,
          name: j.name ?? 'job',
          failedReason: (j.failedReason ?? 'Unknown error').slice(0, 500),
          attemptsMade: j.attemptsMade ?? 0,
          failed_at: j.finishedOn
            ? new Date(j.finishedOn).toISOString()
            : j.timestamp
              ? new Date(j.timestamp).toISOString()
              : new Date().toISOString(),
        };
      };

      const all = [
        ...inboundJobs.map((j) => map(j, QUEUE_NAMES.WHATSAPP_INBOUND)),
        ...outboundJobs.map((j) => map(j, QUEUE_NAMES.WHATSAPP_OUTBOUND)),
      ];
      all.sort((a, b) => b.failed_at.localeCompare(a.failed_at));
      return all.slice(0, limit);
    } catch (err) {
      this.logger.warn(`Failed jobs unavailable: ${(err as Error).message}`);
      return [];
    }
  }

  async cleanFailedJobs(): Promise<{ removed: number }> {
    try {
      // BullMQ Queue.clean(grace, limit, status) — grace=0ms removes everything
      const [inboundCleaned, outboundCleaned] = await Promise.all([
        this.inboundQueue.clean(0, 10_000, 'failed'),
        this.outboundQueue.clean(0, 10_000, 'failed'),
      ]);
      const removed = (inboundCleaned?.length ?? 0) + (outboundCleaned?.length ?? 0);
      this.logger.log(`Cleaned ${removed} failed jobs from WhatsApp queues`);
      return { removed };
    } catch (err) {
      this.logger.error(`Failed to clean jobs: ${(err as Error).message}`);
      return { removed: 0 };
    }
  }

  async getWorkers(): Promise<WorkerInfoResult[]> {
    try {
      const [inboundWorkers, outboundWorkers] = await Promise.all([
        this.inboundQueue.getWorkers(),
        this.outboundQueue.getWorkers(),
      ]);

      const all: Array<{ queue: string; raw: Record<string, unknown> }> = [
        ...inboundWorkers.map((w) => ({
          queue: QUEUE_NAMES.WHATSAPP_INBOUND as string,
          raw: w as Record<string, unknown>,
        })),
        ...outboundWorkers.map((w) => ({
          queue: QUEUE_NAMES.WHATSAPP_OUTBOUND as string,
          raw: w as Record<string, unknown>,
        })),
      ];

      return all.map(({ queue, raw }) => {
        const startedRaw = raw.started;
        const startedMs = typeof startedRaw === 'number' ? startedRaw : Number(startedRaw);
        const lastBeatRaw = raw.lastBeat ?? startedMs;
        const lastBeatMs = typeof lastBeatRaw === 'number' ? lastBeatRaw : Number(lastBeatRaw);
        const uptimeMs = Number.isFinite(startedMs) ? Date.now() - startedMs : 0;
        const idStr = String(raw.name ?? raw.id ?? 'worker');

        return {
          name: `${queue}:${idStr.slice(-8)}`,
          state: 'running' as const,
          uptime: this.formatUptime(uptimeMs),
          lastHeartbeat: Number.isFinite(lastBeatMs)
            ? new Date(lastBeatMs).toISOString()
            : new Date().toISOString(),
        };
      });
    } catch (err) {
      this.logger.warn(`Worker list unavailable: ${(err as Error).message}`);
      return [];
    }
  }

  private async checkDatabase(): Promise<{ status: 'operational' | 'down'; latency: number }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'operational', latency: Date.now() - start };
    } catch {
      return { status: 'down', latency: Date.now() - start };
    }
  }

  private async checkRedis(): Promise<{ status: 'operational' | 'down'; latency: number }> {
    const start = Date.now();
    try {
      const client = await this.inboundQueue.client;
      await client.ping();
      return { status: 'operational', latency: Date.now() - start };
    } catch {
      return { status: 'down', latency: Date.now() - start };
    }
  }

  private formatUptime(ms: number): string {
    if (ms <= 0) return '—';
    const sec = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }
}
