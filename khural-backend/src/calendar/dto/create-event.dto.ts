import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty({ required: true, example: 'Заседание комитета' })
  @IsString()
  title: string;

  @ApiProperty({
    required: false,
    description: 'Описание события',
    example: 'Обсуждение законопроекта о...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: true,
    description: 'Дата и время начала (timestamp)',
    example: 1721049600000,
  })
  @Type(() => Number)
  @IsNumber()
  startDate: number;

  @ApiProperty({
    required: false,
    description: 'Дата и время окончания (timestamp)',
    example: 1721053200000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  endDate?: number;

  @ApiProperty({
    required: false,
    description: 'Место проведения',
    example: 'Зал заседаний Верховного Хурала',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    required: false,
    description: 'ID типа события',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  eventTypeId?: number;

  @ApiProperty({
    required: false,
    description: 'Массив ID участников (депутатов)',
    example: [1, 2, 3],
  })
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @IsOptional()
  participantIds?: number[];

  @ApiProperty({
    required: false,
    default: true,
    description: 'Публичное ли событие',
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

