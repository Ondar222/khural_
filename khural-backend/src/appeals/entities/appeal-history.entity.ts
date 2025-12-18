import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';
import { AppealEntity } from './appeal.entity';
import { AppealStatusEntity } from './appeal-status.entity';
import { User } from '../../user/user.entity';

@Entity('appeal_history')
export class AppealHistoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => AppealEntity)
  @JoinColumn({ name: 'appeal_id' })
  appeal: AppealEntity;

  @ManyToOne(() => AppealStatusEntity)
  @JoinColumn({ name: 'status_id' })
  status: AppealStatusEntity;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: User | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDate() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

