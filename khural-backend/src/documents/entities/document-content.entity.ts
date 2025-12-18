import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { Locale, ILocalizedContent } from '../../common/interfaces/localizable.interface';

@Entity('document_content')
export class DocumentContentEntity implements ILocalizedContent {
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

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => DocumentEntity, (document) => document.id)
  @JoinColumn({ name: 'document_id' })
  document: DocumentEntity;
}

