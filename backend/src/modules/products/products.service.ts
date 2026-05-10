import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

export interface ProductFilters {
  type?: 'product' | 'service';
  search?: string;
  activeOnly?: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(
    subscriberId: string,
    filters: ProductFilters = {},
  ): Promise<Product[]> {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .where('p.subscriber_id = :subscriberId', { subscriberId });

    if (filters.activeOnly !== false) {
      qb.andWhere('p.is_active = TRUE');
    }

    if (filters.type) {
      qb.andWhere('p.type = :type', { type: filters.type });
    }

    if (filters.search) {
      qb.andWhere('LOWER(p.name) LIKE :search', {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }

    qb.orderBy('p.name', 'ASC');
    return qb.getMany();
  }

  async findById(subscriberId: string, productId: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id: productId, subscriber_id: subscriberId },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return product;
  }

  /**
   * Case-insensitive lookup by name. Used by the AI to resolve a budget
   * line ("100kg de cimento") against the user's catalog before falling
   * back to the LLM-extracted price.
   */
  async findByName(
    subscriberId: string,
    name: string,
  ): Promise<Product | null> {
    return this.productRepo
      .createQueryBuilder('p')
      .where('p.subscriber_id = :subscriberId', { subscriberId })
      .andWhere('LOWER(p.name) = LOWER(:name)', { name: name.trim() })
      .andWhere('p.is_active = TRUE')
      .getOne();
  }

  async create(
    subscriberId: string,
    data: CreateProductDto,
  ): Promise<Product> {
    const existing = await this.findByName(subscriberId, data.name);
    if (existing) {
      throw new ConflictException('Já existe um produto com esse nome.');
    }

    const product = this.productRepo.create({
      subscriber_id: subscriberId,
      name: data.name,
      description: data.description ?? null,
      sku: data.sku ?? null,
      price: this.round2(data.price),
      type: data.type ?? 'product',
      unit: data.unit ?? 'un',
      stock: data.stock ?? null,
    });

    return this.productRepo.save(product);
  }

  async update(
    subscriberId: string,
    productId: string,
    data: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findById(subscriberId, productId);

    if (data.name !== undefined && data.name !== product.name) {
      const conflict = await this.findByName(subscriberId, data.name);
      if (conflict && conflict.id !== productId) {
        throw new ConflictException('Já existe um produto com esse nome.');
      }
      product.name = data.name;
    }

    if (data.description !== undefined)
      product.description = data.description ?? null;
    if (data.sku !== undefined) product.sku = data.sku ?? null;
    if (data.price !== undefined) product.price = this.round2(data.price);
    if (data.type !== undefined) product.type = data.type;
    if (data.unit !== undefined) product.unit = data.unit;
    if (data.stock !== undefined) product.stock = data.stock ?? null;
    if (data.is_active !== undefined) product.is_active = data.is_active;

    return this.productRepo.save(product);
  }

  async remove(subscriberId: string, productId: string): Promise<void> {
    const product = await this.findById(subscriberId, productId);
    // Soft delete keeps history for budgets that referenced this product.
    await this.productRepo.softRemove(product);
  }

  /** Round to 2 decimal places for currency math (BRL is 2-decimal). */
  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
