import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from '../role/role.entity';
import { Files } from '../files/files.entity';
import { ApiProperty } from '@nestjs/swagger';
import { genDefaultEmail } from '../common/utils/email';
import { IsEmail } from 'class-validator';


@Entity({ name: 'users' })
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ default: 'default_name' })
  name?: string;

  @ApiProperty()
  @Column({ default: 'default_surname' })
  surname?: string;

  @ApiProperty()
  @Column({ nullable: true })
  patronymic: string;

  @ApiProperty()
  @IsEmail()
  @Column({ unique: true, default: genDefaultEmail() })
  email: string;

  @ApiProperty()
  @Column({ unique: true, nullable: true })
  phone?: string;

  @Column({
    transformer: {
      from: (password) => '******',
      to: (value) => value,
    },
  })
  password: string;

  @OneToOne(() => Files, (files) => files.id)
  @JoinColumn({ name: 'avatar' })
  avatar: Files;

  @Column({ default: 'active', nullable: true })
  status: string;

  @ManyToOne(() => Role, (role) => role.id)
  @JoinColumn({ name: 'role' })
  role: Role;

}
