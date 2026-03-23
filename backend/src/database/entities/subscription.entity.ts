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
import { Plan } from './plan.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  @Index('idx_subscriptions_subscriber')
  subscriber_id: string;

  @ManyToOne(() => Plan)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ type: 'uuid' })
  plan_id: string;

  @Column({ type: 'varchar', length: 20, default: 'trialing' })
  status: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_gateway_id: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  trial_ends_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_start: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_end: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
