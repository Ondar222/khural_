import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Files } from '../../files/files.entity';

type HotelAddress = Record<string, unknown>;

class HotelCreateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsUUID()
  administrator: string;

  @ApiProperty()
  address?: HotelAddress;

  @ApiProperty({ type: () => Files })
  cover?: Files;

  @ApiProperty()
  images?: Array<Files>;

  @ApiProperty()
  arrival?: string;

  @ApiProperty()
  departure?: string;
}

class HotelUpdateDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  contacts: {
    phone: string;
    email: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  images?: Array<Files>;

  @ApiProperty({ type: () => Files, required: false })
  @IsOptional()
  cover?: Files;

  @ApiProperty({ required: false })
  @IsOptional()
  arrival?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  departure?: string;
}

class HotelGetAvailableRoomsDto {
  @ApiProperty()
  @Length(10, 10)
  check_in: number;

  @ApiProperty()
  @Length(10, 10)
  check_out: number;

  @ApiProperty()
  capacity: number;
}

export { HotelGetAvailableRoomsDto, HotelCreateDto, HotelUpdateDto };
