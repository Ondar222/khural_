import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  AfterLoad,
} from 'typeorm';
import { Files } from '../../files/files.entity';

@Entity('slider_items')
export class SliderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  buttonText: string;

  @Column({ nullable: true })
  buttonLink: string;

  @OneToOne(() => Files, { nullable: true })
  @JoinColumn({ name: 'image_id' })
  image: Files | null;

  @Column({ default: 0 })
  order: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  autoRotateInterval: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  setCdnUrl() {
    if (this.image?.id) {
      const cdnUrl = process.env.CDN || '';
      const cdnBase = cdnUrl.endsWith('/') ? cdnUrl : `${cdnUrl}/`;
      this.image = {
        id: this.image.id,
        link: `${cdnBase}${this.image.id}`,
      } as any;
    } else if (this.image === null) {
      this.image = null;
    }

    if (this.createdAt instanceof Date) {
      (this as any).createdAt = this.createdAt.toISOString();
    }
    if (this.updatedAt instanceof Date) {
      (this as any).updatedAt = this.updatedAt.toISOString();
    }
  }
}

