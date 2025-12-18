import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';
import { NewsEntity } from '../../news/entities/news.entity';

export enum SocialPlatform {
  VK = 'vk',
  TELEGRAM = 'telegram',
}

@Entity('social_export_logs')
export class SocialExportLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NewsEntity)
  @JoinColumn({ name: 'news_id' })
  news: NewsEntity;

  @Column({
    type: 'enum',
    enum: SocialPlatform,
  })
  platform: SocialPlatform;

  @Column({ default: false })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDate() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

