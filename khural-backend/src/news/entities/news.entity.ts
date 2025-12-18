import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Files } from '../../files/files.entity';
import { NewsCategory } from './news-category.entity';

@Entity('news')
export class NewsEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  shortDescription: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => NewsCategory)
  @JoinColumn({ name: 'category_id' })
  category: NewsCategory;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @OneToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'cover_image_id' })
  coverImage: Files | null;

  @ManyToMany(() => Files)
  @JoinTable({
    name: 'news_gallery',
    joinColumn: {
      name: 'news_id',
    },
    inverseJoinColumn: {
      name: 'file_id',
    },
  })
  gallery: Files[];

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: 0 })
  viewsCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  setCdnUrl() {
    // Обработка cover_image - только id и link
    if (this.coverImage?.id) {
      const cdnUrl = process.env.CDN || '';
      const cdnBase = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
      this.coverImage = {
        id: this.coverImage.id,
        link: `${cdnBase}${this.coverImage.id}`,
      } as any;
    } else if (this.coverImage === null) {
      this.coverImage = null;
    }

    // Обработка gallery - только id и link
    if (this.gallery?.length) {
      const cdnUrl = process.env.CDN || '';
      const cdnBase = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
      this.gallery = this.gallery.map((file) => ({
        id: file.id,
        link: `${cdnBase}${file.id}`,
      })) as any;
    }

    if (this.publishedAt instanceof Date) {
      (this as any).publishedAt = this.publishedAt.toISOString();
    } else if (this.publishedAt === null || this.publishedAt === undefined) {
      (this as any).publishedAt = null;
    }

    // Конвертируем Date в ISO 8601 строку для дат
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }
  }
}
