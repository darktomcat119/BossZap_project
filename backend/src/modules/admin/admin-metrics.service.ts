import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber, Payment, UsageTracking } from '../../database/entities';

export interface OverviewResult {
  totalSubscribers: number;
  activeSubscribers: number;
  suspendedSubscribers: number;
  onboardingSubscribers: number;
  cancelledSubscribers: number;
  revenueThisMonth: number;
}

export interface GrowthPoint {
  month: string;
  count: number;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
}

interface TopSubscriberUsage {
  subscriber_id: string;
  business_name: string | null;
  total_messages: number;
  total_ai_calls: number;
  total_budgets: number;
}

export interface UsageStatsResult {
  totalMessages: number;
  totalAiCalls: number;
  totalBudgets: number;
  topSubscribers: TopSubscriberUsage[];
}

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(UsageTracking)
    private readonly usageRepo: Repository<UsageTracking>,
  ) {}

  async getOverview(): Promise<OverviewResult> {
    const statusCounts = await this.subscriberRepo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)::int', 'count')
      .groupBy('s.status')
      .getRawMany<{ status: string; count: number }>();

    const statusMap: Record<string, number> = {};
    for (const row of statusCounts) {
      statusMap[row.status] = Number(row.count);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const revenueResult = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)::numeric', 'revenue')
      .where('p.status = :status', { status: 'succeeded' })
      .andWhere('p.paid_at >= :monthStart', { monthStart })
      .getRawOne<{ revenue: string }>();

    const totalSubscribers = Object.values(statusMap).reduce(
      (sum, c) => sum + c,
      0,
    );

    return {
      totalSubscribers,
      activeSubscribers: statusMap['active'] ?? 0,
      suspendedSubscribers: statusMap['suspended'] ?? 0,
      onboardingSubscribers: statusMap['onboarding'] ?? 0,
      cancelledSubscribers: statusMap['cancelled'] ?? 0,
      revenueThisMonth: parseFloat(revenueResult?.revenue ?? '0'),
    };
  }

  async getGrowthTrend(months: number = 12): Promise<GrowthPoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows = await this.subscriberRepo
      .createQueryBuilder('s')
      .select("TO_CHAR(s.created_at, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.created_at >= :since', { since })
      .groupBy("TO_CHAR(s.created_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; count: number }>();

    return rows.map((r) => ({
      month: r.month,
      count: Number(r.count),
    }));
  }

  async getRevenueTrend(months: number = 12): Promise<RevenuePoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows = await this.paymentRepo
      .createQueryBuilder('p')
      .select("TO_CHAR(p.paid_at, 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(p.amount), 0)::numeric', 'revenue')
      .where('p.status = :status', { status: 'succeeded' })
      .andWhere('p.paid_at >= :since', { since })
      .groupBy("TO_CHAR(p.paid_at, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; revenue: string }>();

    return rows.map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue),
    }));
  }

  async getUsageStats(): Promise<UsageStatsResult> {
    const totals = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.messages_count), 0)::int', 'totalMessages')
      .addSelect('COALESCE(SUM(u.ai_calls_count), 0)::int', 'totalAiCalls')
      .addSelect('COALESCE(SUM(u.budgets_count), 0)::int', 'totalBudgets')
      .getRawOne<{
        totalMessages: number;
        totalAiCalls: number;
        totalBudgets: number;
      }>();

    const topSubscribers = await this.usageRepo
      .createQueryBuilder('u')
      .leftJoin('u.subscriber', 's')
      .select('u.subscriber_id', 'subscriber_id')
      .addSelect('s.business_name', 'business_name')
      .addSelect('SUM(u.messages_count)::int', 'total_messages')
      .addSelect('SUM(u.ai_calls_count)::int', 'total_ai_calls')
      .addSelect('SUM(u.budgets_count)::int', 'total_budgets')
      .groupBy('u.subscriber_id')
      .addGroupBy('s.business_name')
      .orderBy('total_messages', 'DESC')
      .limit(10)
      .getRawMany<TopSubscriberUsage>();

    return {
      totalMessages: Number(totals?.totalMessages ?? 0),
      totalAiCalls: Number(totals?.totalAiCalls ?? 0),
      totalBudgets: Number(totals?.totalBudgets ?? 0),
      topSubscribers,
    };
  }
}
