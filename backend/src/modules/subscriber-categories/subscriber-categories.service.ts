import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriberCategory } from '../../database/entities/subscriber-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

// Standard Brazilian MEI categories. Names are deliberately in PT-BR
// since the MEI program is a Brazilian regulatory framework — these
// labels are the ones users see on government tax forms.
const DEFAULT_BRAZILIAN_MEI_CATEGORIES: Array<{ name: string; type: string }> =
  [
    // Income
    { name: 'Serviço prestado', type: 'income' },
    { name: 'Venda de produto', type: 'income' },
    { name: 'Gorjeta', type: 'income' },
    // Expenses (the most common MEI deductible categories)
    { name: 'Aluguel', type: 'expense' },
    { name: 'Alimentação', type: 'expense' },
    { name: 'Materiais', type: 'expense' },
    { name: 'Mão de obra', type: 'expense' },
    { name: 'Transporte', type: 'expense' },
    { name: 'Combustível', type: 'expense' },
    { name: 'Ferramentas', type: 'expense' },
    { name: 'Marketing', type: 'expense' },
    { name: 'Telefonia / Internet', type: 'expense' },
    { name: 'Contas de consumo', type: 'expense' },
    // General
    { name: 'Outros', type: 'both' },
  ];

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
      throw new ConflictException('Já existe uma categoria com esse nome.');
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
      throw new NotFoundException('Categoria não encontrada.');
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
      throw new NotFoundException('Categoria não encontrada.');
    }

    await this.categoryRepo.remove(category);
  }

  /**
   * Bulk-create the standard Brazilian MEI category set for a subscriber.
   * Skips any names that already exist (idempotent — safe to call again).
   * Returns the full active list after seeding.
   */
  async seedDefaults(subscriberId: string): Promise<SubscriberCategory[]> {
    const existing = await this.categoryRepo.find({
      where: { subscriber_id: subscriberId },
    });
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

    const toCreate = DEFAULT_BRAZILIAN_MEI_CATEGORIES.filter(
      (def) => !existingNames.has(def.name.toLowerCase()),
    ).map((def) =>
      this.categoryRepo.create({
        subscriber_id: subscriberId,
        name: def.name,
        type: def.type,
      }),
    );

    if (toCreate.length > 0) {
      await this.categoryRepo.save(toCreate);
    }

    return this.findAll(subscriberId);
  }
}
