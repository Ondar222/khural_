import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsEmail, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePersonDto {
  @ApiProperty({ required: true })
  @IsString()
  fullName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  electoralDistrict?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  faction?: string;

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

  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  placeOfBirth?: string;

  @ApiProperty({ required: false })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ type: 'array', items: { type: 'number' }, required: false })
  @IsOptional()
  categoryIds?: string[];

  // @ApiProperty({ type: 'string', format: 'binary', required: false })
  // @IsOptional()
  // image?: Express.Multer.File;
}

// export class CreatePersonsRequestBody {
//   categoryIds?: Array<{ name: 'Депутат' | 'Руководитель' | ''; }> | null;
// }