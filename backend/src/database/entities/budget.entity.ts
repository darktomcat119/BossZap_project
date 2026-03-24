import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';

@Entity('budgets')
@Index('idx_budgets_subscriber_created', ['subscriber_id', 'created_at'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 20, default: 'budget' })
  document_type: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  document_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_name: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  client_phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  client_email: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  items: Record<string, unknown>[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdf_url: string | null;

  @Column({ type: 'date', nullable: true })
  valid_until: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
