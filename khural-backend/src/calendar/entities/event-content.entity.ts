import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EventEntity } from './event.entity';
import { Locale, ILocalizedContent } from '../../common/interfaces/localizable.interface';

@Entity('event_content')
export class EventContentEntity implements ILocalizedContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Locale,
  })
  locale: Locale;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => EventEntity, (event) => event.id)
  @JoinColumn({ name: 'event_id' })
  event: EventEntity;
}

