import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';

@Entity('products')
@Index('idx_products_subscriber', ['subscriber_id'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number;

  // 'product' (physical good with stock) | 'service' (no stock).
  @Column({ type: 'varchar', length: 10, default: 'product' })
  type: string;

  // Free-form unit of measure: "un", "kg", "hora", "m²", "saco", etc.
  @Column({ type: 'varchar', length: 20, default: 'un' })
  unit: string;

  // Stock quantity. NULL for services (stock doesn't apply) and for
  // products the user hasn't enabled stock-tracking for yet.
  @Column({ type: 'int', nullable: true })
  stock: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
