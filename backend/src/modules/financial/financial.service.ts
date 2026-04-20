import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialRecord } from '../../database/entities/financial-record.entity';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { UpdateFinancialRecordDto } from './dto/update-financial-record.dto';

export interface FinancialFilters {
  type?: 'income' | 'expense';
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface FinancialSummary {
  total_income: number;
  total_expense: number;
  net: number;
  count: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
}

export interface DailyTotal {
  date: string;
  income: number;
  expense: number;
  profit: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(FinancialRecord)
    private readonly financialRepo: Repository<FinancialRecord>,
  ) {}

  async createRecord(
    subscriberId: string,
    data: CreateFinancialRecordDto,
  ): Promise<FinancialRecord> {
    const record = this.financialRepo.create({
      subscriber_id: subscriberId,
      type: data.type,
      amount: data.amount,
      description: data.description ?? null,
      category: data.category ?? 'other',
      reference_person: data.reference_person ?? null,
      record_date: data.record_date,
    });

    return this.financialRepo.save(record);
  }

  async findAll(
    subscriberId: string,
    filters: FinancialFilters,
  ): Promise<{ records: FinancialRecord[]; total: number }> {
    const qb = this.financialRepo
      .createQueryBuilder('fr')
      .where('fr.subscriber_id = :subscriberId', { subscriberId });

    if (filters.type) {
      qb.andWhere('fr.type = :type', { type: filters.type });
    }

    if (filters.category) {
      qb.andWhere('fr.category = :category', { category: filters.category });
    }

    if (filters.startDate) {
      qb.andWhere('fr.record_date >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters.endDate) {
      qb.andWhere('fr.record_date <= :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.search) {
      qb.andWhere('fr.description ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    const page = Math.max(filters.page, 1);
    const limit = Math.min(Math.max(filters.limit, 1), 100);

    qb.orderBy('fr.record_date', 'DESC')
      .addOrderBy('fr.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [records, total] = await qb.getManyAndCount();

    return { records, total };
  }

  async getSummary(
    subscriberId: string,
    startDate: string,
    endDate: string,
  ): Promise<FinancialSummary> {
    const result = await this.financialRepo
      .createQueryBuilder('fr')
      .select(
        `COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount ELSE 0 END), 0)`,
        'total_income',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount ELSE 0 END), 0)`,
        'total_expense',
      )
      .addSelect('COUNT(fr.id)', 'count')
      .where('fr.subscriber_id = :subscriberId', { subscriberId })
      .andWhere('fr.record_date >= :startDate', { startDate })
      .andWhere('fr.record_date <= :endDate', { endDate })
      .getRawOne();

    const total_income = parseFloat(result.total_income) || 0;
    const total_expense = parseFloat(result.total_expense) || 0;
    const count = parseInt(result.count, 10) || 0;

    return {
      total_income,
      total_expense,
      net: total_income - total_expense,
      count,
    };
  }

  async getCategoryBreakdown(
    subscriberId: string,
    startDate: string,
    endDate: string,
    type: 'income' | 'expense',
  ): Promise<CategoryBreakdown[]> {
    const rows: { category: string; total: string; count: string }[] =
      await this.financialRepo
        .createQueryBuilder('fr')
        .select('COALESCE(fr.category, :defaultCat)', 'category')
        .addSelect('SUM(fr.amount)', 'total')
        .addSelect('COUNT(*)::int', 'count')
        .where('fr.subscriber_id = :subscriberId', { subscriberId })
        .andWhere('fr.type = :type', { type })
        .andWhere('fr.record_date >= :startDate', { startDate })
        .andWhere('fr.record_date <= :endDate', { endDate })
        .setParameter('defaultCat', 'other')
        .groupBy('fr.category')
        .orderBy('total', 'DESC')
        .getRawMany();

    return rows.map((row) => ({
      category: row.category,
      total: parseFloat(row.total) || 0,
      count: parseInt(row.count, 10) || 0,
    }));
  }

  async getDailyTotals(
    subscriberId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyTotal[]> {
    const rows: {
      date: string;
      income: string;
      expense: string;
    }[] = await this.financialRepo
      .createQueryBuilder('fr')
      .select('fr.record_date', 'date')
      .addSelect(
        `COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount ELSE 0 END), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount ELSE 0 END), 0)`,
        'expense',
      )
      .where('fr.subscriber_id = :subscriberId', { subscriberId })
      .andWhere('fr.record_date >= :startDate', { startDate })
      .andWhere('fr.record_date <= :endDate', { endDate })
      .groupBy('fr.record_date')
      .orderBy('fr.record_date', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      const income = parseFloat(row.income) || 0;
      const expense = parseFloat(row.expense) || 0;
      return {
        date: row.date,
        income,
        expense,
        profit: income - expense,
      };
    });
  }

  async getMonthlyTrend(
    subscriberId: string,
    months: number,
  ): Promise<MonthlyTrend[]> {
    const rows: {
      month: string;
      income: string;
      expense: string;
    }[] = await this.financialRepo
      .createQueryBuilder('fr')
      .select(`TO_CHAR(fr.record_date, 'YYYY-MM')`, 'month')
      .addSelect(
        `COALESCE(SUM(CASE WHEN fr.type = 'income' THEN fr.amount ELSE 0 END), 0)`,
        'income',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN fr.type = 'expense' THEN fr.amount ELSE 0 END), 0)`,
        'expense',
      )
      .where('fr.subscriber_id = :subscriberId', { subscriberId })
      .andWhere(
        `fr.record_date >= (CURRENT_DATE - INTERVAL '1 month' * :months)`,
        { months },
      )
      .groupBy(`TO_CHAR(fr.record_date, 'YYYY-MM')`)
      .orderBy('month', 'ASC')
      .getRawMany();

    return rows.map((row) => {
      const income = parseFloat(row.income) || 0;
      const expense = parseFloat(row.expense) || 0;
      return {
        month: row.month,
        income,
        expense,
        profit: income - expense,
      };
    });
  }

  async updateRecord(
    subscriberId: string,
    recordId: string,
    data: UpdateFinancialRecordDto,
  ): Promise<FinancialRecord> {
    const record = await this.financialRepo.findOne({
      where: { id: recordId, subscriber_id: subscriberId },
    });

    if (!record) {
      throw new NotFoundException('Financial record not found');
    }

    if (data.type !== undefined) record.type = data.type;
    if (data.amount !== undefined) record.amount = data.amount;
    if (data.description !== undefined)
      record.description = data.description ?? null;
    if (data.category !== undefined) record.category = data.category ?? null;
    if (data.reference_person !== undefined)
      record.reference_person = data.reference_person ?? null;
    if (data.record_date !== undefined) record.record_date = data.record_date;

    return this.financialRepo.save(record);
  }

  async deleteRecord(subscriberId: string, recordId: string): Promise<void> {
    const record = await this.financialRepo.findOne({
      where: { id: recordId, subscriber_id: subscriberId },
    });

    if (!record) {
      throw new NotFoundException('Financial record not found');
    }

    await this.financialRepo.remove(record);
  }

  async getRecordsForExport(
    subscriberId: string,
    startDate?: string,
    endDate?: string,
    type?: 'income' | 'expense',
  ): Promise<FinancialRecord[]> {
    const qb = this.financialRepo
      .createQueryBuilder('fr')
      .where('fr.subscriber_id = :subscriberId', { subscriberId });

    if (type) {
      qb.andWhere('fr.type = :type', { type });
    }

    if (startDate) {
      qb.andWhere('fr.record_date >= :startDate', { startDate });
    }

    if (endDate) {
      qb.andWhere('fr.record_date <= :endDate', { endDate });
    }

    qb.orderBy('fr.record_date', 'ASC').addOrderBy('fr.created_at', 'ASC');

    return qb.getMany();
  }
}
