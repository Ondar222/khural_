import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../entities/document.entity';

export class CreateDocumentDto {
  @ApiProperty({ required: true, example: 'О внесении изменений в закон...' })
  @IsString()
  title: string;

  @ApiProperty({
    required: false,
    example: '123-ЗРТ',
    description: 'Номер документа',
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiProperty({
    required: true,
    enum: DocumentType,
    example: DocumentType.LAW,
    description: 'Тип документа',
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    required: false,
    description: 'Текст документа для полнотекстового поиска',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    required: false,
    description: 'ID категории документа',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    required: false,
    description: 'ID PDF файла (можно загрузить через отдельный endpoint)',
    example: 'uuid-file-id',
  })
  @IsString()
  @IsOptional()
  pdfFileId?: string;

  @ApiProperty({
    required: false,
    description: 'Метаданные документа',
    example: {
      author: 'Верховный Хурал РТ',
      department: 'Комитет по законодательству',
      keywords: ['закон', 'изменения'],
    },
  })
  @IsObject()
  @IsOptional()
  metadata?: {
    author?: string;
    department?: string;
    keywords?: string[];
    [key: string]: any;
  };

  @ApiProperty({
    required: false,
    description: 'Дата принятия/публикации в формате timestamp',
    example: 1721049600000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  publishedAt?: number;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Опубликован ли документ',
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

