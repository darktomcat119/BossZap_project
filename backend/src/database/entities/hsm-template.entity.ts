import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('hsm_templates')
@Index('idx_hsm_language_category', ['language', 'category'])
export class HsmTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  template_name: string;

  @Column({ type: 'varchar', length: 5 })
  language: string;

  @Column({ type: 'varchar', length: 50 })
  category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  meta_template_id: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  meta_status: string;

  @Column({ type: 'text' })
  body_text: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
