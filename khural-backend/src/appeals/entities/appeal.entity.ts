import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { AppealStatusEntity } from './appeal-status.entity';
import { Files } from '../../files/files.entity';

@Entity('appeals')
@Index(['user'])
@Index(['status'])
@Index(['createdAt'])
export class AppealEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @ManyToOne(() => AppealStatusEntity)
  @JoinColumn({ name: 'status_id' })
  status: AppealStatusEntity;

  @ManyToMany(() => Files)
  @JoinTable({
    name: 'appeal_attachments',
    joinColumn: { name: 'appeal_id' },
    inverseJoinColumn: { name: 'file_id' },
  })
  attachments: Files[];

  @Column({ type: 'text', nullable: true })
  response: string | null;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responded_by_id' })
  respondedBy: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  formatDates() {
    if (this.respondedAt instanceof Date) {
      (this as any).respondedAt = this.respondedAt.toISOString();
    }
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }

    // Обработка attachments
    if (this.attachments?.length) {
      const cdnUrl = process.env.CDN || '';
      const cdnBase = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
      this.attachments = this.attachments.map((file) => ({
        id: file.id,
        link: `${cdnBase}${file.id}`,
      })) as any;
    }
  }
}

