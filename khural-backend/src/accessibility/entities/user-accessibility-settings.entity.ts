import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('user_accessibility_settings')
export class UserAccessibilitySettingsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ default: 16 })
  fontSize: number;

  @Column({ default: 'default' })
  colorScheme: string;

  @Column({ default: 'normal' })
  contrast: string;

  @Column({ default: false })
  disableAnimations: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDate() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

