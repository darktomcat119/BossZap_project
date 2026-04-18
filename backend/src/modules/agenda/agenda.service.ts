import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Event } from '../../database/entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

export interface PaginatedEvents {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async createEvent(
    subscriberId: string,
    data: CreateEventDto,
  ): Promise<Event> {
    const event = this.eventRepo.create({
      ...data,
      subscriber_id: subscriberId,
      status: 'scheduled',
    });
    return this.eventRepo.save(event);
  }

  async findById(subscriberId: string, eventId: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId, subscriber_id: subscriberId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findByDate(subscriberId: string, date: string): Promise<Event[]> {
    return this.eventRepo.find({
      where: { subscriber_id: subscriberId, event_date: date },
      order: { event_time: 'ASC' },
    });
  }

  async findUpcoming(subscriberId: string, limit = 5): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.eventRepo.find({
      where: {
        subscriber_id: subscriberId,
        status: 'scheduled',
        event_date: MoreThanOrEqual(today),
      },
      order: { event_date: 'ASC', event_time: 'ASC' },
      take: limit,
    });
  }

  async findByDateRange(
    subscriberId: string,
    startDate: string,
    endDate: string,
  ): Promise<Event[]> {
    return this.eventRepo.find({
      where: {
        subscriber_id: subscriberId,
        event_date: Between(startDate, endDate),
      },
      order: { event_date: 'ASC', event_time: 'ASC' },
    });
  }

  async findAll(
    subscriberId: string,
    options: {
      date?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedEvents> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.eventRepo
      .createQueryBuilder('event')
      .where('event.subscriber_id = :subscriberId', { subscriberId });

    if (options.date) {
      qb.andWhere('event.event_date = :date', { date: options.date });
    }

    if (options.startDate && options.endDate) {
      qb.andWhere('event.event_date BETWEEN :startDate AND :endDate', {
        startDate: options.startDate,
        endDate: options.endDate,
      });
    }

    if (options.status) {
      qb.andWhere('event.status = :status', { status: options.status });
    }

    qb.orderBy('event.event_date', 'ASC')
      .addOrderBy('event.event_time', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateEvent(
    subscriberId: string,
    eventId: string,
    data: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.findById(subscriberId, eventId);

    if (event.subscriber_id !== subscriberId) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(event, data);
    return this.eventRepo.save(event);
  }

  async cancelEvent(subscriberId: string, eventId: string): Promise<Event> {
    const event = await this.findById(subscriberId, eventId);
    event.status = 'cancelled';
    return this.eventRepo.save(event);
  }

  async completeEvent(subscriberId: string, eventId: string): Promise<Event> {
    const event = await this.findById(subscriberId, eventId);
    event.status = 'completed';
    return this.eventRepo.save(event);
  }

  async getMonthlyCalendar(
    subscriberId: string,
    year: number,
    month: number,
  ): Promise<Event[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    return this.findByDateRange(subscriberId, startDate, endDate);
  }
}
