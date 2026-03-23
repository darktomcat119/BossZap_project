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
import { Plan } from './plan.entity';

@Entity('subscribers')
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  @Index('idx_subscribers_phone', { unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  business_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  owner_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 5, default: 'es' })
  preferred_language: string;

  @Column({ type: 'varchar', length: 20, default: 'onboarding' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null;

  @ManyToOne(() => Plan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan | null;

  @Column({ type: 'uuid', nullable: true })
  plan_id: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  onboarding_completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
