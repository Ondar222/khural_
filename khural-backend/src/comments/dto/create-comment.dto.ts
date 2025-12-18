import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { CommentEntityType } from '../entities/comment.entity';

export class CreateCommentDto {
  @ApiProperty({
    required: true,
    description: 'Текст комментария',
    example: 'Очень интересная статья!',
  })
  @IsString()
  content: string;

  @ApiProperty({
    required: false,
    description: 'ID родительского комментария (для ответов)',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  parentCommentId?: number;

  @ApiProperty({
    required: true,
    enum: CommentEntityType,
    description: 'Тип сущности, к которой относится комментарий',
    example: CommentEntityType.NEWS,
  })
  @IsEnum(CommentEntityType)
  entityType: CommentEntityType;

  @ApiProperty({
    required: true,
    description: 'ID сущности (новости или документа)',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  entityId: number;
}

