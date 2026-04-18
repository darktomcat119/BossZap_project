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

@Entity('conversation_history')
@Index('idx_conversation_subscriber_created', ['subscriber_id', 'created_at'])
export class ConversationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscriber)
  @JoinColumn({ name: 'subscriber_id' })
  subscriber: Subscriber;

  @Column({ type: 'uuid' })
  subscriber_id: string;

  @Column({ type: 'varchar', length: 10 })
  role: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  intent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
