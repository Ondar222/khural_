import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

class AuthResetPasswordDTO {
  @ApiProperty()
  @IsString()
  email: string;
}

export { AuthResetPasswordDTO };
