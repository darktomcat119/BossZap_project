import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities';

interface AuditLogFilters {
  subscriberId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async findAuditLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs> {
    const { subscriberId, action, dateFrom, dateTo, page, limit } = filters;

    const qb = this.auditLogRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.subscriber', 'subscriber');

    if (subscriberId) {
      qb.andWhere('log.subscriber_id = :subscriberId', { subscriberId });
    }

    if (action) {
      qb.andWhere('log.action = :action', { action });
    }

    if (dateFrom) {
      qb.andWhere('log.created_at >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('log.created_at <= :dateTo', { dateTo });
    }

    qb.orderBy('log.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getSystemLogs(): Promise<{ message: string }> {
    return {
      message: 'System log viewer - placeholder for future implementation',
    };
  }
}
