import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 20, default: 'master' })
  role: string;

  @Column({ type: 'varchar', length: 10, default: 'pt-BR' })
  preferred_language: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
