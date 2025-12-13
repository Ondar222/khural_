import {
  AfterLoad, BeforeInsert, BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity, JoinColumn, JoinTable, ManyToMany, OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Files } from '../../files/files.entity';
import { NewsContentEntity } from './news-content.entity';

@Entity('news')
export class NewsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ unique: true, nullable: true })
  externalId?: string;

  @Column({ nullable: true })
  category?: string;

  // original publication date if needed (YYYY-MM-DD)
  @Column({ nullable: true })
  publishedAt?: string;


  @OneToMany(() => NewsContentEntity, (entity) => entity.news,
    { cascade: true, eager: true })
  content?: NewsContentEntity[] | null;

  @ManyToMany(() => Files, (files) => files.news,  { cascade: ['insert'] })
  @JoinTable({
    name: "news_files",
    joinColumn: {
      name: "news_id",
    },
    inverseJoinColumn: {
      name: "files_id",
    },
  })
  images?: Files[];



  @AfterLoad()
  setCdnUrl() {
    const cdn = process.env.CDN || '/files/v2/';
    const prefix = cdn.endsWith('/') ? cdn : `${cdn}/`;
    if (!Array.isArray(this.images)) return;
    this.images.forEach((img) => {
      if (!img?.id) return;
      (img as any).link = `${prefix}${img.id}`;
    });
  }
}
