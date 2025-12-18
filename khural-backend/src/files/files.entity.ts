import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { NewsEntity } from '../news/entities/news.entity';
import { NewsRepository } from '../news/news.repository';
import { PersonEntity } from '../persons/entities/person.entity';

@Entity({ name: "files" })
export class Files {
  @PrimaryColumn("uuid")
  id: string;

  @Column({})
  storage?: string;

  @Column({})
  filename_disk: string;

  @Column({ nullable: true })
  filename_download?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: "uuid", nullable: true })
  uploaded_by?: string;

  @CreateDateColumn({ nullable: true })
  uploaded_on?: string;

  @UpdateDateColumn({ nullable: true })
  modified_on?: string;

  @Column({ nullable: true })
  filesize?: number;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @OneToOne(() => PersonEntity, (insight) => insight.id)
  person?: PersonEntity;

  @ManyToMany(() => NewsEntity, (news) => news.gallery)
  news?: NewsEntity[];
  link?: string;
}