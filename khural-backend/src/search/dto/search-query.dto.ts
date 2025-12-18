import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum SearchContentType {
  ALL = 'all',
  NEWS = 'news',
  DOCUMENTS = 'documents',
  PERSONS = 'persons',
}

export class SearchQueryDto {
  @ApiProperty({
    required: true,
    description: 'Поисковый запрос',
    example: 'закон об образовании',
  })
  @IsString()
  query: string;

  @ApiProperty({
    required: false,
    enum: SearchContentType,
    default: SearchContentType.ALL,
    description: 'Тип контента для поиска',
  })
  @IsEnum(SearchContentType)
  @IsOptional()
  contentType?: SearchContentType;

  @ApiProperty({
    required: false,
    description: 'Массив типов контента',
    enum: SearchContentType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(SearchContentType, { each: true })
  @IsOptional()
  contentTypes?: SearchContentType[];

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
    description: 'Количество результатов на странице',
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;
}

