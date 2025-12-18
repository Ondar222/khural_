import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class District {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

