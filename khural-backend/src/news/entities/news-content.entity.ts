import {
  Column,
  Entity,
  JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NewsEntity } from './news.entity';
import { Locale, ILocalizedContent } from '../../common/interfaces/localizable.interface';

@Entity('news_content')
export class NewsContentEntity implements ILocalizedContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: Locale,
  })
  locale: Locale;

  @Column()
  title: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => NewsEntity, (news) => news.id)
  @JoinColumn({ name: 'news_id' })
  news: NewsEntity;
}
