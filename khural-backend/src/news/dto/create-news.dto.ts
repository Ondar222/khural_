import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';


export class CreatePersonFilesDto {
  images?: { id: string; link: string }[];
}


export class CreateNewsDto {
  @ApiProperty()
  @IsArray()
  images?: { id: string; link: string }[];

  @ApiProperty({ type: [Object] })
  @IsArray()
  content: Array<{ lang: 'tu' | 'ru'; title: string; description: string }>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, description: "YYYY-MM-DD" })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;
}
