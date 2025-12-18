import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAppealDto {
  @ApiProperty({
    required: false,
    description: 'ID статуса обращения',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  statusId?: number;

  @ApiProperty({
    required: false,
    description: 'Ответ на обращение',
    example: 'Ваше обращение рассмотрено...',
  })
  @IsString()
  @IsOptional()
  response?: string;
}

