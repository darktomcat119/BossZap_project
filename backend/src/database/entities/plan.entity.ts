import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  price_monthly: number;

  @Column({ type: 'int', default: 50 })
  max_budgets_per_month: number;

  @Column({ type: 'int', default: 500 })
  max_messages_per_month: number;

  @Column({ type: 'int', default: 300 })
  max_ai_calls_per_month: number;

  @Column({ type: 'int', default: 7 })
  trial_days: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripe_price_id: string | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
