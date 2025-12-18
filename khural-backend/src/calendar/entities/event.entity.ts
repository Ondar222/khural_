import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  AfterLoad,
  Index,
} from 'typeorm';
import { EventTypeEntity } from './event-type.entity';
import { PersonEntity } from '../../persons/entities/person.entity';

@Entity('events')
@Index(['startDate'])
@Index(['endDate'])
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ nullable: true })
  location: string;

  @ManyToOne(() => EventTypeEntity, { nullable: true })
  @JoinColumn({ name: 'event_type_id' })
  eventType: EventTypeEntity | null;

  @ManyToMany(() => PersonEntity)
  @JoinTable({
    name: 'event_participants',
    joinColumn: { name: 'event_id' },
    inverseJoinColumn: { name: 'person_id' },
  })
  participants: PersonEntity[];

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDates() {
    if (this.startDate instanceof Date) {
      (this as any).startDate = this.startDate.toISOString();
    }
    if (this.endDate instanceof Date) {
      (this as any).endDate = this.endDate.toISOString();
    }
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

