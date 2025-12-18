import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSliderItemDto {
  @ApiProperty({ required: true, example: 'Заголовок слайда' })
  @IsString()
  title: string;

  @ApiProperty({
    required: false,
    description: 'Описание слайда',
    example: 'Краткое описание события или новости',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
    description: 'Текст кнопки',
    example: 'Подробнее',
  })
  @IsString()
  @IsOptional()
  buttonText?: string;

  @ApiProperty({
    required: false,
    description: 'Ссылка для кнопки',
    example: '/news/123',
  })
  @IsString()
  @IsOptional()
  buttonLink?: string;

  @ApiProperty({
    required: false,
    description: 'ID изображения (можно загрузить через отдельный endpoint)',
    example: 'uuid-file-id',
  })
  @IsString()
  @IsOptional()
  imageId?: string;

  @ApiProperty({
    required: false,
    default: 0,
    description: 'Порядок отображения',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({
    required: false,
    default: true,
    description: 'Активен ли слайд',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    required: false,
    description: 'Интервал автоматической прокрутки в миллисекундах',
    example: 5000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  autoRotateInterval?: number;
}

