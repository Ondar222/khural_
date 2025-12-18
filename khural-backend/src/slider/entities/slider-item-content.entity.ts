import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SliderItemEntity } from './slider-item.entity';
import { Locale, ILocalizedContent } from '../../common/interfaces/localizable.interface';

@Entity('slider_item_content')
export class SliderItemContentEntity implements ILocalizedContent {
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

  @Column({ nullable: true })
  buttonText: string;

  @ManyToOne(() => SliderItemEntity, (item) => item.id)
  @JoinColumn({ name: 'slider_item_id' })
  sliderItem: SliderItemEntity;
}

