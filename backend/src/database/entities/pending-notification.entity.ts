import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';

@Entity('pending_notifications')
@Index('idx_notifications_subscriber_status', ['subscriber_id', 'status'])
export class PendingNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 2, default: 'P2' })
  priority: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date | null;
}
