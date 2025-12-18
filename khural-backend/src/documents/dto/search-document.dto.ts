import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../entities/document.entity';

export class SearchDocumentDto {
  @ApiProperty({
    required: false,
    description: 'Поисковый запрос (по названию, номеру, содержимому)',
    example: 'закон об образовании',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    required: false,
    description: 'ID категории для фильтрации',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    required: false,
    description: 'Тип документа',
    enum: DocumentType,
    example: DocumentType.LAW,
  })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiProperty({
    required: false,
    description: 'Массив типов документов',
    enum: DocumentType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  @IsOptional()
  types?: DocumentType[];

  @ApiProperty({
    required: false,
    description: 'Год принятия документа',
    example: 2024,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiProperty({
    required: false,
    description: 'Дата начала периода (timestamp)',
    example: 1721049600000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dateFrom?: number;

  @ApiProperty({
    required: false,
    description: 'Дата конца периода (timestamp)',
    example: 1735689600000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dateTo?: number;

  @ApiProperty({
    required: false,
    default: 1,
    description: 'Номер страницы',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    required: false,
    default: 20,
    description: 'Количество элементов на странице',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}

