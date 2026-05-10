import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';

export interface AdminPaymentSummary {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
}

export interface AdminPaymentListItem {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  gateway_payment_id: string | null;
  paid_at: Date | null;
  created_at: Date;
  subscription_id: string;
  subscriber_id: string | null;
  subscriber_name: string | null;
  subscriber_email: string | null;
  subscriber_phone: string | null;
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async list(limit = 100, status?: string): Promise<AdminPaymentListItem[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.subscription', 's')
      .leftJoinAndSelect('s.subscriber', 'subscriber')
      .orderBy('p.created_at', 'DESC')
      .take(Math.min(limit, 500));

    if (status) {
      qb.where('p.status = :status', { status });
    }

    const rows = await qb.getMany();

    // Flatten subscriber info to the top level so the admin UI can read
    // a simple `subscriber_name` regardless of the join state. Falls back
    // to email or phone when the business/owner name isn't set.
    return rows.map((p) => {
      const sub = p.subscription?.subscriber ?? null;
      const name =
        sub?.business_name ||
        sub?.owner_name ||
        sub?.email ||
        sub?.phone ||
        null;
      return {
        id: p.id,
        amount: Number(p.amount),
        status: p.status,
        payment_method: p.payment_method,
        gateway_payment_id: p.gateway_payment_id,
        paid_at: p.paid_at,
        created_at: p.created_at,
        subscription_id: p.subscription_id,
        subscriber_id: sub?.id ?? null,
        subscriber_name: name,
        subscriber_email: sub?.email ?? null,
        subscriber_phone: sub?.phone ?? null,
      };
    });
  }

  async summary(): Promise<AdminPaymentSummary> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sumSince = async (since: Date): Promise<number> => {
      const res = await this.paymentRepo
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.amount), 0)', 'total')
        .where('p.status = :status', { status: 'succeeded' })
        .andWhere('p.paid_at >= :since', { since })
        .getRawOne<{ total: string }>();
      return parseFloat(res?.total ?? '0');
    };

    const [revenueToday, revenueWeek, revenueMonth] = await Promise.all([
      sumSince(startOfDay),
      sumSince(startOfWeek),
      sumSince(startOfMonth),
    ]);

    return { revenueToday, revenueWeek, revenueMonth };
  }
}
