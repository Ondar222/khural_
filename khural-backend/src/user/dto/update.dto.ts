import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { IsFile } from 'nestjs-form-data';
import { Files } from '../../files/files.entity';

class UserUpdateDto {
  @ApiProperty({
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  surname?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

class UserUpdateDtoMFD extends UserUpdateDto {
  @ApiProperty({
    type: String,
    format: 'binary',
    required: false,
  })
  @IsFile()
  avatar?: Files;
}

export { UserUpdateDto, UserUpdateDtoMFD };
