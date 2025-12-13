import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { EUserRole } from '../../lib/types/user-role';
import { Role } from '../../role/role.entity';

@Entity()
export class UserEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name?: string;

  @ApiProperty()
  @Column()
  surname?: string;

  @ApiProperty()
  @Column({ unique: true })
  phone?: string;

  @ApiProperty()
  @IsEmail()
  @Column({ unique: true })
  email?: string;

  @Column({
    transformer: {
      from: (password) => "******",
      to: (value) => value,
    },
  })
  password?: string;

  @ManyToOne(() => Role, (role) => role.id, {eager:true})
  @JoinColumn({ name: "roleId" })
  role?: Role;

  @Column()
  status?: string;

}
