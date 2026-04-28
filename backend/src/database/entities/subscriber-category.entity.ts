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

@Entity('subscriber_categories')
@Index('idx_subscriber_categories_subscriber', ['subscriber_id'])
export class SubscriberCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10, default: 'both' })
  type: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
