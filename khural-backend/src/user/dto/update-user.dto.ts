import { IsString, IsOptional, IsPhoneNumber, IsEmail, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: true })
  @IsPhoneNumber("RU")
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsStrongPassword(
    {},
    {
      message: "Введен слишком простой пароль!",
    }
  )
  password?: string;
}
