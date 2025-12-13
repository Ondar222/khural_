import {
  Column,
  Entity,
  JoinColumn, ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { NewsEntity } from './news.entity';

@Entity('news_content')
export class NewsContentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  lang: string;

  @Column()
  title: string;

  @ApiProperty()
  @Column()
  description: string;

  @ManyToOne(() => NewsEntity, (news) => news.id)
  @JoinColumn({ name: 'news_id' })
  news: NewsEntity;
}
