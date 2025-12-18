import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateAppealDto {
  @ApiProperty({ required: true, example: 'Вопрос о законопроекте' })
  @IsString()
  subject: string;

  @ApiProperty({
    required: true,
    description: 'Текст обращения',
    example: 'Прошу разъяснить положения законопроекта...',
  })
  @IsString()
  message: string;

  @ApiProperty({
    required: false,
    description: 'Массив ID прикрепленных файлов',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachmentIds?: string[];
}

