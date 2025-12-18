import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';

export enum CommentEntityType {
  NEWS = 'news',
  DOCUMENT = 'document',
}

@Entity('comments')
@Index(['entityType', 'entityId'])
@Index(['isApproved'])
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => CommentEntity, (comment) => comment.replies, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: CommentEntity | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parentComment)
  replies: CommentEntity[];

  @Column({
    type: 'enum',
    enum: CommentEntityType,
  })
  entityType: CommentEntityType;

  @Column()
  entityId: number;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ default: false })
  isModerated: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderator_id' })
  moderator: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  formatDates() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }
  }
}

