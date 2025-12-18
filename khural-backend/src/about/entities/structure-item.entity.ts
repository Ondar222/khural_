import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  AfterLoad,
} from 'typeorm';
import { PageEntity } from './page.entity';

@Entity('structure_items')
export class StructureItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => StructureItemEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: StructureItemEntity | null;

  @ManyToOne(() => PageEntity, { nullable: true })
  @JoinColumn({ name: 'page_id' })
  page: PageEntity | null;

  @Column({ default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  formatDate() {
    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
  }
}

