import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { AppealEntity } from './appeal.entity';

export enum AppealStatusEnum {
  RECEIVED = 'received',
  IN_PROGRESS = 'in_progress',
  RESPONDED = 'responded',
  CLOSED = 'closed',
}

@Entity('appeal_statuses')
export class AppealStatusEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'enum',
    enum: AppealStatusEnum,
    unique: true,
  })
  code: AppealStatusEnum;

  @Column({ nullable: true })
  color: string;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => AppealEntity, (appeal) => appeal.status)
  appeals: AppealEntity[];
}

