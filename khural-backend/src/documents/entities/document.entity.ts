import { AfterLoad, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Files } from "../../files/files.entity";

@Entity("documents")
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ unique: true, nullable: true })
  externalId?: string;

  @Column()
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  // laws / resolutions / initiatives / etc.
  @Column({ nullable: true })
  type?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  number?: string;

  @Column({ nullable: true })
  date?: string;

  // External link (e.g. khural.rtyva.ru) if no uploaded file
  @Column({ nullable: true })
  url?: string;

  @OneToOne(() => Files, { nullable: true, eager: true })
  @JoinColumn({ name: "file_id" })
  file?: Files | null;

  @AfterLoad()
  setCdnUrl() {
    if (!this.file?.id) return;
    const cdn = process.env.CDN || '/files/v2/';
    const prefix = cdn.endsWith('/') ? cdn : `${cdn}/`;
    (this.file as any).link = `${prefix}${this.file.id}`;
  }
}





