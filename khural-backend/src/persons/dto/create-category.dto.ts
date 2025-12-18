import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ required: true, example: 'Депутат', description: 'Название категории' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateConvocationDto {
  @ApiProperty({ required: true, example: 'VIII созыв', description: 'Название созыва' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateFactionDto {
  @ApiProperty({ required: true, example: 'VIII созыв', description: 'Название созыва' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreateDistrictDto {
  @ApiProperty({ required: true, example: 'VIII созыв', description: 'Название созыва' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
