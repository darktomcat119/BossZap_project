import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';

@Entity('usage_tracking')
@Unique(['subscriber_id', 'month'])
@Index('idx_usage_subscriber_month', ['subscriber_id', 'month'], {
  unique: true,
})
export class UsageTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'date' })
  month: string;

  @Column({ type: 'int', default: 0 })
  messages_count: number;

  @Column({ type: 'int', default: 0 })
  budgets_count: number;

  @Column({ type: 'int', default: 0 })
  ai_calls_count: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
