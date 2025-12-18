import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNewsDto {
  @ApiProperty({ required: true, example: 'Сессия парламента июль 2025' })
  @IsString()
  title: string;

  @ApiProperty({ 
    required: false,
    description: 'URL-совместимый слаг. Если не указан, будет сгенерирован автоматически',
    example: 'sessiya-iyul-2025'
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ 
    required: false,
    example: 'Итоги сессии, ключевые решения и обсужденные законопроекты.'
  })
  @IsString()
  @IsOptional()
  shortDescription?: string;

  @ApiProperty({ 
    required: true,
    description: 'HTML контент новости',
    example: '<p>Во время сессии обсуждались вопросы...</p>'
  })
  @IsString()
  content: string;

  @ApiProperty({ 
    required: true,
    description: 'ID категории новости',
    example: 1
  })
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @ApiProperty({ 
    required: false,
    description: 'Дата публикации в формате timestamp (число миллисекунд). Если не указана, используется текущая дата',
    example: 1721049600000
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  publishedAt?: number;

  @ApiProperty({ 
    required: false,
    description: 'ID файла обложки (можно загрузить через отдельный endpoint)',
    example: 'uuid-file-id'
  })
  @IsString()
  @IsOptional()
  coverImageId?: string;

  @ApiProperty({ 
    required: false,
    description: 'Массив ID файлов для галереи',
    example: ['uuid-1', 'uuid-2']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  galleryIds?: string[];

  @ApiProperty({ 
    required: false,
    default: false,
    description: 'Опубликована ли новость'
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
