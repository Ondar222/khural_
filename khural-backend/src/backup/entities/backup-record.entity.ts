import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';

@Entity('backup_records')
export class BackupRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  filepath: string;

  @Column({ type: 'bigint' })
  filesize: number;

  @Column({ default: false })
  isRestored: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDate() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

