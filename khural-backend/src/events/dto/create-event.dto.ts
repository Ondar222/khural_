import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CreateEventDto {
  @ApiProperty({ description: "YYYY-MM-DD" })
  @IsString()
  date: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  externalId?: string;
}
