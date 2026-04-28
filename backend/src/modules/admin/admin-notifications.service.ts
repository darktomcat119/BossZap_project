import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Payment } from '../../database/entities/payment.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { QUEUE_NAMES } from '../queue/constants';

type NotificationSeverity = 'info' | 'warning' | 'critical';
type NotificationType =
  | 'payment_failed'
  | 'subscriber_suspended'
  | 'subscriber_cancelled'
  | 'queue_backlog'
  | 'audit_critical';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationsSummary {
  total: number;
  by_severity: { info: number; warning: number; critical: number };
}

const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;
const HOURS_24_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AdminNotificationsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_INBOUND)
    private readonly inboundQueue: Queue,
    @InjectQueue(QUEUE_NAMES.WHATSAPP_OUTBOUND)
    private readonly outboundQueue: Queue,
  ) {}

  async getNotifications(): Promise<AdminNotification[]> {
    const since7d = new Date(Date.now() - DAYS_7_MS);
    const since24h = new Date(Date.now() - HOURS_24_MS);

    const [
      failedPayments,
      suspendedSubs,
      cancelledSubs,
      criticalAudits,
      queueFailedCount,
    ] = await Promise.all([
      this.findFailedPayments(since7d),
      this.findSubscribersByStatus('suspended', since7d),
      this.findSubscribersByStatus('cancelled', since7d),
      this.findCriticalAudits(since24h),
      this.getQueueFailedCount(),
    ]);

    const items: AdminNotification[] = [];

    for (const p of failedPayments) {
      items.push({
        id: `payment:${p.id}`,
        type: 'payment_failed',
        severity: 'critical',
        title: 'Pagamento falhou',
        message: `Pagamento de R$ ${Number(p.amount).toFixed(2)} (${p.payment_method}) não foi processado.`,
        link: '/payments',
        created_at: p.created_at.toISOString(),
        metadata: { payment_id: p.id, amount: p.amount },
      });
    }

    for (const s of suspendedSubs) {
      items.push({
        id: `suspended:${s.id}`,
        type: 'subscriber_suspended',
        severity: 'warning',
        title: 'Assinante suspenso',
        message: `${s.business_name ?? s.owner_name ?? s.phone} foi suspenso(a).`,
        link: `/subscribers`,
        created_at: s.updated_at.toISOString(),
        metadata: { subscriber_id: s.id },
      });
    }

    for (const s of cancelledSubs) {
      items.push({
        id: `cancelled:${s.id}`,
        type: 'subscriber_cancelled',
        severity: 'warning',
        title: 'Assinatura cancelada',
        message: `${s.business_name ?? s.owner_name ?? s.phone} cancelou a assinatura.`,
        link: `/subscribers`,
        created_at: s.updated_at.toISOString(),
        metadata: { subscriber_id: s.id },
      });
    }

    for (const a of criticalAudits) {
      items.push({
        id: `audit:${a.id}`,
        type: 'audit_critical',
        severity: 'info',
        title: this.formatAuditTitle(a.action),
        message: a.entity_type
          ? `Ação "${a.action}" em ${a.entity_type}.`
          : `Ação administrativa: "${a.action}".`,
        link: `/logs?action=${encodeURIComponent(a.action)}`,
        created_at: a.created_at.toISOString(),
        metadata: { audit_id: a.id, action: a.action },
      });
    }

    if (queueFailedCount > 0) {
      items.push({
        id: 'queue:failed',
        type: 'queue_backlog',
        severity: queueFailedCount > 50 ? 'critical' : 'warning',
        title: 'Falhas na fila',
        message: `${queueFailedCount} job(s) falharam nas filas do WhatsApp.`,
        link: '/health',
        created_at: new Date().toISOString(),
        metadata: { failed_count: queueFailedCount },
      });
    }

    items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return items;
  }

  async getSummary(): Promise<NotificationsSummary> {
    const items = await this.getNotifications();
    const counts = { info: 0, warning: 0, critical: 0 };
    for (const n of items) counts[n.severity] += 1;
    return { total: items.length, by_severity: counts };
  }

  private async findFailedPayments(since: Date): Promise<Payment[]> {
    return this.paymentRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: 'failed' })
      .andWhere('p.created_at >= :since', { since })
      .orderBy('p.created_at', 'DESC')
      .limit(20)
      .getMany();
  }

  private async findSubscribersByStatus(
    status: string,
    since: Date,
  ): Promise<Subscriber[]> {
    return this.subscriberRepo
      .createQueryBuilder('s')
      .where('s.status = :status', { status })
      .andWhere('s.updated_at >= :since', { since })
      .orderBy('s.updated_at', 'DESC')
      .limit(20)
      .getMany();
  }

  private async findCriticalAudits(since: Date): Promise<AuditLog[]> {
    return this.auditRepo
      .createQueryBuilder('log')
      .where('log.created_at >= :since', { since })
      .andWhere('log.action IN (:...actions)', {
        actions: ['deleted', 'subscriber_suspended', 'subscriber_deactivated'],
      })
      .orderBy('log.created_at', 'DESC')
      .limit(20)
      .getMany();
  }

  private async getQueueFailedCount(): Promise<number> {
    try {
      const [a, b] = await Promise.all([
        this.inboundQueue.getJobCounts('failed'),
        this.outboundQueue.getJobCounts('failed'),
      ]);
      return (a.failed ?? 0) + (b.failed ?? 0);
    } catch {
      return 0;
    }
  }

  private formatAuditTitle(action: string): string {
    const map: Record<string, string> = {
      deleted: 'Registro excluído',
      subscriber_suspended: 'Assinante suspenso',
      subscriber_deactivated: 'Assinante desativado',
    };
    return map[action] ?? `Ação: ${action}`;
  }
}
