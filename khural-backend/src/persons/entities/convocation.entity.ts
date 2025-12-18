import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Convocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}

