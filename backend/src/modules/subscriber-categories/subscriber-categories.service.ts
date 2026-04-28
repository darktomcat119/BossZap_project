import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriberCategory } from '../../database/entities/subscriber-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class SubscriberCategoriesService {
  constructor(
    @InjectRepository(SubscriberCategory)
    private readonly categoryRepo: Repository<SubscriberCategory>,
  ) {}

  async findAll(subscriberId: string): Promise<SubscriberCategory[]> {
    return this.categoryRepo.find({
      where: { subscriber_id: subscriberId, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async create(
    subscriberId: string,
    data: CreateCategoryDto,
  ): Promise<SubscriberCategory> {
    const existing = await this.categoryRepo.findOne({
      where: { subscriber_id: subscriberId, name: data.name },
    });
    if (existing) {
      throw new ConflictException('A category with this name already exists');
    }

    const category = this.categoryRepo.create({
      subscriber_id: subscriberId,
      name: data.name,
      type: data.type ?? 'both',
    });

    return this.categoryRepo.save(category);
  }

  async update(
    subscriberId: string,
    categoryId: string,
    data: UpdateCategoryDto,
  ): Promise<SubscriberCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, subscriber_id: subscriberId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (data.name !== undefined) category.name = data.name;
    if (data.type !== undefined) category.type = data.type;
    if (data.is_active !== undefined) category.is_active = data.is_active;

    return this.categoryRepo.save(category);
  }

  async remove(subscriberId: string, categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId, subscriber_id: subscriberId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepo.remove(category);
  }
}
