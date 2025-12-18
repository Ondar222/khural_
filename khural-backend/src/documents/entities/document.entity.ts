import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
  Index,
} from 'typeorm';
import { DocumentCategoryEntity } from './document-category.entity';
import { Files } from '../../files/files.entity';

export enum DocumentType {
  LAW = 'law',
  RESOLUTION = 'resolution',
  DECISION = 'decision',
  ORDER = 'order',
  OTHER = 'other',
}

@Entity('documents')
@Index(['number', 'type'], { unique: true })
@Index(['publishedAt'])
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true, unique: true })
  number: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => DocumentCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: DocumentCategoryEntity | null;

  @OneToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'pdf_file_id' })
  pdfFile: Files | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    author?: string;
    department?: string;
    keywords?: string[];
    [key: string]: any;
  } | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ default: false })
  isPublished: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  setCdnUrl() {
    if (this.pdfFile?.id) {
      const cdnUrl = process.env.CDN || '';
      const cdnBase = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
      this.pdfFile = {
        id: this.pdfFile.id,
        link: `${cdnBase}${this.pdfFile.id}`,
      } as any;
    } else if (this.pdfFile === null) {
      this.pdfFile = null;
    }

    if (this.publishedAt instanceof Date) {
      (this as any).publishedAt = this.publishedAt.toISOString();
    } else if (this.publishedAt === null || this.publishedAt === undefined) {
      (this as any).publishedAt = null;
    }

    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }
  }
}

