import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('document_categories')
export class DocumentCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: number;

  @ManyToOne(() => DocumentCategoryEntity, (category) => category.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent: DocumentCategoryEntity | null;

  @OneToMany(() => DocumentCategoryEntity, (category) => category.parent)
  children: DocumentCategoryEntity[];

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;
}

