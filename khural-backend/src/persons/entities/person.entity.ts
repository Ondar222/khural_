import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToOne,
  JoinColumn,
  AfterLoad,
  OneToMany,
} from 'typeorm';
import { Category } from './category.entity';
import { Files } from '../../files/files.entity';
import { DeclarationEntity } from './declaration.entity';
import { Faction } from './faction.entity';
import { District } from './district.entity';
import { Convocation } from './convocation.entity';

@Entity()
export class PersonEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToMany(() => Category)
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Faction)
  @JoinTable({ name: 'person_factions' })
  factions: Faction[];

  @ManyToMany(() => District)
  @JoinTable({ name: 'person_districts' })
  districts: District[];

  @ManyToMany(() => Convocation)
  @JoinTable({ name: 'person_convocations' })
  convocations: Convocation[];

  @OneToMany(() => DeclarationEntity, (declaration) => declaration.person)
  declarations: DeclarationEntity[];

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  electoralDistrict: string;

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

  @Column({ type: 'timestamp', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  placeOfBirth: string;

  @OneToOne(() => Files, (files) => files.id)
  @JoinColumn({ name: "images" })
  image: Files | null;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ nullable: true, type: 'json' })
  receptionSchedule: {
    dayOfWeek?: string;
    time?: string;
    location?: string;
    notes?: string;
  } | null;

  @AfterLoad()
  setCdnUrl() {
    if (this.image?.id) {
      const cdnUrl = process.env.CDN || '';
      // Возвращаем только id и link
      this.image = {
        id: this.image.id,
        link: `${cdnUrl}${this.image.id}`,
      } as any;
    } else if (this.image === null) {
      this.image = null;
    }
    
    // Конвертируем Date в timestamp (number) для возврата в API
    if (this.dateOfBirth instanceof Date) {
      (this as any).dateOfBirth = this.dateOfBirth.getTime();
    } else if (this.dateOfBirth === null || this.dateOfBirth === undefined) {
      (this as any).dateOfBirth = null;
    }
    if (this.startDate instanceof Date) {
      (this as any).startDate = this.startDate.getTime();
    } else if (this.startDate === null || this.startDate === undefined) {
      (this as any).startDate = null;
    }
  }
}