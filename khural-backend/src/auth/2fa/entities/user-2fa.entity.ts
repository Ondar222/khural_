import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../../user/user.entity';

@Entity('user_2fa')
export class User2FAEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  secret: string;

  @Column({ default: false })
  isEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

