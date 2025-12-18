import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsEmail, IsPhoneNumber, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonDto } from './create-person.dto';

export class UpdatePersonDto extends PartialType(CreatePersonDto) {
  @ApiProperty({ required: false, description: 'График приёма граждан' })
  @IsObject()
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
  })
  @IsOptional()
  categoryIds?: string[];
}

