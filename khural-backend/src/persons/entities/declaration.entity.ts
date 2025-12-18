import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  AfterLoad,
  CreateDateColumn,
} from 'typeorm';
import { PersonEntity } from './person.entity';
import { Files } from '../../files/files.entity';

export enum DeclarationType {
  INCOME = 'income',
  ASSETS = 'assets',
}

@Entity()
export class DeclarationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PersonEntity, (person) => person.declarations)
  @JoinColumn({ name: 'person_id' })
  person: PersonEntity;

  @Column({
    type: 'enum',
    enum: DeclarationType,
    default: DeclarationType.INCOME,
  })
  type: DeclarationType;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Files)
  @JoinColumn({ name: 'pdf_file_id' })
  pdfFile: Files | null;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  setCdnUrl() {
    if (this.pdfFile?.id) {
      const cdnUrl = process.env.CDN || '';
      // Возвращаем только id и link, как для image
      this.pdfFile = {
        id: this.pdfFile.id,
        link: `${cdnUrl}${this.pdfFile.id}`,
      } as any;
    } else if (this.pdfFile === null) {
      this.pdfFile = null;
    }
    
    // Конвертируем Date в timestamp (number) для возврата в API
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.getTime();
    } else if (this.createdAt === null || this.createdAt === undefined) {
      (this as any).createdAt = null;
    }
  }
}

