import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('news_categories')
export class NewsCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

