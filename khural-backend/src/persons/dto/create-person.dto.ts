import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePersonDto {
  @ApiProperty({ required: true })
  @IsString()
  fullName: string;

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'number' }, 
    required: false,
    description: 'Массив ID округов (можно получить через GET /persons/districts/all). Пример: [1, 2]',
    example: [1, 2]
  })
  @IsOptional()
  districtIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  electoralDistrict?: string;

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'number' }, 
    required: false,
    description: 'Массив ID фракций (можно получить через GET /persons/factions/all). Пример: [1, 2]',
    example: [1, 2]
  })
  @IsOptional()
  factionIds?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  committee?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  workExperience?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false, description: 'Дата рождения в формате timestamp (число миллисекунд)', example: 1609459200000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dateOfBirth?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  placeOfBirth?: string;

  @ApiProperty({ required: false, description: 'Дата начала полномочий в формате timestamp (число миллисекунд)', example: 1609459200000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  startDate?: number;

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'number' }, 
    required: false,
    description: 'Массив ID созывов (можно получить через GET /persons/convocations/all). Пример: [1, 2]',
    example: [1, 2]
  })
  @IsOptional()
  convocationIds?: string[];

  @ApiProperty({ required: false, description: 'График приёма граждан' })
  @IsOptional()
  receptionSchedule?: {
    dayOfWeek?: string;
    time?: string;
    location?: string;
    notes?: string;
  };

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'number' }, 
    required: false,
    description: 'Массив ID категорий (можно получить через GET /persons/categories/all). Пример: [1, 2]',
    example: [1, 2]
  })
  @IsOptional()
  categoryIds?: string[];

  // @ApiProperty({ type: 'string', format: 'binary', required: false })
  // @IsOptional()
  // image?: Express.Multer.File;
}

// export class CreatePersonsRequestBody {
//   categoryIds?: Array<{ name: 'Депутат' | 'Руководитель' | ''; }> | null;
// }