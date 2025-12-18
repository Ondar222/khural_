import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

class AuthRefreshDto {
  @ApiProperty()
  @IsString()
  refresh: string;
}

export { AuthRefreshDto };
