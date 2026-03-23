import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../../database/entities/subscriber.entity';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
  ) {}

  async findByPhone(phone: string): Promise<Subscriber | null> {
    return this.subscriberRepo.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<Subscriber> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id },
    });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }
    return subscriber;
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    return this.subscriberRepo.findOne({ where: { email } });
  }

  async create(
    data: Partial<Subscriber>,
  ): Promise<Subscriber> {
    const subscriber = this.subscriberRepo.create(data);
    return this.subscriberRepo.save(subscriber);
  }

  async update(
    id: string,
    data: Partial<Subscriber>,
  ): Promise<Subscriber> {
    await this.subscriberRepo.update(id, data);
    return this.findById(id);
  }
}
