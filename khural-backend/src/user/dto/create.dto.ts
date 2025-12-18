import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsPhoneNumber, IsStrongPassword } from 'class-validator';
import { EUserRole } from '../../lib/types/user-role';


class UserCreateDto {
  @ApiProperty({ required: false })
  @IsOptional()
  surname?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: true })
  @IsPhoneNumber("RU")
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsStrongPassword(
    {},
    {
      message: "Введен слишком простой пароль!",
    }
  )
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(EUserRole)
  role: EUserRole = EUserRole.citizen;
}

class UserAvatarDto {
  @ApiProperty({
    type: String,
    format: "binary",
  })
  avatar: string;
}

export { UserCreateDto, UserAvatarDto };
