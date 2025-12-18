import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
} from 'typeorm';
import { Files } from '../../files/files.entity';
import { Locale } from '../../common/interfaces/localizable.interface';

@Entity('pages')
export class PageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: Locale,
    default: Locale.RU,
  })
  locale: Locale;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToMany(() => Files)
  @JoinTable({
    name: 'page_images',
    joinColumn: { name: 'page_id' },
    inverseJoinColumn: { name: 'file_id' },
  })
  images: Files[];

  @Column({ type: 'jsonb', nullable: true })
  videos: string[];

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  formatDates() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }
  }
}

