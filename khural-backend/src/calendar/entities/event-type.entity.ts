import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { EventEntity } from './event.entity';

@Entity('event_types')
export class EventTypeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => EventEntity, (event) => event.eventType)
  events: EventEntity[];
}

