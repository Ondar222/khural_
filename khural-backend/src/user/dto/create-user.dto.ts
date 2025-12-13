import {
  IsString,
  IsOptional,
  IsStrongPassword,
  IsPhoneNumber,
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EUserRole } from '../../lib/types/user-role';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  surname?: string;

  @ApiProperty({ required: true })
  @IsPhoneNumber("RU")
  phone: string;

  @ApiProperty({ required: true })
  code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email: string;

  @IsString()
  @IsEnum(EUserRole)
  role: EUserRole;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}
