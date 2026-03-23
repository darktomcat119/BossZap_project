import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Subscriber } from './subscriber.entity';

@Entity('message_window_tracking')
export class MessageWindowTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid', unique: true })
  @Index('idx_window_subscriber', { unique: true })
  subscriber_id: string;

  @Column({ type: 'timestamptz' })
  last_inbound_at: Date;

  @Column({ type: 'timestamptz' })
  window_expires_at: Date;
}
