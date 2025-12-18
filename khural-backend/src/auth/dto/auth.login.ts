import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

class AuthLoginByPhoneDTO {
  @ApiProperty()
  @IsPhoneNumber('RU')
  phone: string;
}

class AuthLoginByEmailDTO {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export { AuthLoginByPhoneDTO, AuthLoginByEmailDTO };
