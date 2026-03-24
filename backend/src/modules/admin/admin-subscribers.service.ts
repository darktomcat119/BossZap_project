import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Subscriber,
  Subscription,
  Payment,
  UsageTracking,
  AuditLog,
  ConversationHistory,
} from '../../database/entities';
import { AdminSubscriberFiltersDto } from './dto/admin-subscriber-filters.dto';

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SubscriberDetail {
  subscriber: Subscriber;
  subscription: Subscription | null;
  usage: UsageTracking | null;
  recentPayments: Payment[];
  messageCount: number;
  recentConversations: ConversationHistory[];
}

@Injectable()
export class AdminSubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(UsageTracking)
    private readonly usageRepo: Repository<UsageTracking>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
    @InjectRepository(ConversationHistory)
    private readonly conversationRepo: Repository<ConversationHistory>,
  ) {}

  async findAll(
    filters: AdminSubscriberFiltersDto,
  ): Promise<PaginatedResult<Subscriber>> {
    const { search, status, page, limit, sortBy, sortOrder } = filters;

    const qb: SelectQueryBuilder<Subscriber> = this.subscriberRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan');

    if (search) {
      qb.andWhere(
        '(s.business_name ILIKE :search OR s.owner_name ILIKE :search OR s.phone ILIKE :search OR s.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      qb.andWhere('s.status = :status', { status });
    }

    const validSortFields: Record<string, string> = {
      created_at: 's.created_at',
      business_name: 's.business_name',
      owner_name: 's.owner_name',
      status: 's.status',
    };

    const sortField = validSortFields[sortBy ?? 'created_at'] ?? 's.created_at';
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(sortField, order);

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDetail(id: string): Promise<SubscriberDetail> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id },
      relations: ['plan'],
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${id} not found`);
    }

    const subscription = await this.subscriptionRepo.findOne({
      where: { subscriber_id: id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const usage = await this.usageRepo.findOne({
      where: { subscriber_id: id, month: currentMonth },
    });

    const recentPayments = await this.paymentRepo
      .createQueryBuilder('p')
      .innerJoin('p.subscription', 'sub')
      .where('sub.subscriber_id = :id', { id })
      .orderBy('p.created_at', 'DESC')
      .limit(5)
      .getMany();

    const messageCount = await this.conversationRepo.count({
      where: { subscriber_id: id },
    });

    const recentConversations = await this.conversationRepo.find({
      where: { subscriber_id: id },
      order: { created_at: 'DESC' },
      take: 20,
    });

    return {
      subscriber,
      subscription,
      usage,
      recentPayments,
      messageCount,
      recentConversations,
    };
  }

  async activate(id: string): Promise<Subscriber> {
    const subscriber = await this.findSubscriberOrFail(id);
    subscriber.status = 'active';
    const saved = await this.subscriberRepo.save(subscriber);
    await this.createAuditEntry(id, 'subscriber_activated');
    return saved;
  }

  async suspend(id: string): Promise<Subscriber> {
    const subscriber = await this.findSubscriberOrFail(id);
    subscriber.status = 'suspended';
    const saved = await this.subscriberRepo.save(subscriber);
    await this.createAuditEntry(id, 'subscriber_suspended');
    return saved;
  }

  async deactivate(id: string): Promise<Subscriber> {
    const subscriber = await this.findSubscriberOrFail(id);
    subscriber.status = 'cancelled';
    const saved = await this.subscriberRepo.save(subscriber);
    await this.createAuditEntry(id, 'subscriber_deactivated');
    return saved;
  }

  private async findSubscriberOrFail(id: string): Promise<Subscriber> {
    const subscriber = await this.subscriberRepo.findOne({ where: { id } });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber ${id} not found`);
    }
    return subscriber;
  }

  private async createAuditEntry(
    subscriberId: string,
    action: string,
  ): Promise<void> {
    const entry = this.auditLogRepo.create({
      subscriber_id: subscriberId,
      action,
      entity_type: 'subscriber',
      entity_id: subscriberId,
    });
    await this.auditLogRepo.save(entry);
  }
}
