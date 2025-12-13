import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import { Category } from './category.entity';
import { Files } from '../../files/files.entity';

@Entity()
export class PersonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  externalId?: string;

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  electoralDistrict: string;

  @Column({ nullable: true })
  faction: string;

  @Column({ nullable: true })
  convocation: string;

  @Column({ nullable: true })
  committee: string;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  education: string;

  @Column({ nullable: true, type: 'text' })
  workExperience: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  receptionSchedule: string;

  @Column({ nullable: true })
  photoUrl: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true })
  placeOfBirth: string;

  @OneToOne(() => Files, (files) => files.id)
  @JoinColumn({ name: "images" })
  image: Files | null;

  @Column({ nullable: true, type: 'date' })
  startDate: Date;


  @AfterLoad()
  setCdnUrl() {
    const cdn = process.env.CDN || '/files/v2/';
    const prefix = cdn.endsWith('/') ? cdn : `${cdn}/`;
    if (!this.image?.id) return;
    (this.image as any).link = `${prefix}${this.image.id}`;
  }
}