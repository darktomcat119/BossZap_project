import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';

export interface AdminPaymentSummary {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
}

@Injectable()
export class AdminPaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  async list(limit = 100, status?: string): Promise<Payment[]> {
    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.subscription', 's')
      .leftJoin('s.subscriber', 'subscriber')
      .addSelect([
        'subscriber.id',
        'subscriber.email',
        'subscriber.owner_name',
        'subscriber.phone',
      ])
      .orderBy('p.created_at', 'DESC')
      .take(Math.min(limit, 500));

    if (status) {
      qb.where('p.status = :status', { status });
    }

    return qb.getMany();
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
