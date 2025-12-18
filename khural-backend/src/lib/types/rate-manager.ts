import { IsEnum, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RateNames {
  STANDARD = 'standard',
  WEEKEND = 'weekend',
  HOLIDAYS = 'holidays',
  ELEVATED = 'elevated',
  DISCOUNTS = 'discounts',
}

class CreateRateDTO {
  @ApiProperty()
  @IsEnum(RateNames)
  type: RateNames;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  price: number;
}

class BindRateForRoomDTO {
  @ApiProperty()
  rooms: Array<number>;
  @ApiProperty()
  rateId: number;
  @ApiProperty()
  start: number;
  @ApiProperty()
  end: number;
}

class UnbindRateFromRoomDTO {
  @ApiProperty()
  rateId: number;
  @ApiProperty()
  roomId: number;
  @ApiProperty()
  date: number;
}

class CheckIsRateBindableDTO {
  roomId: number;
  start: number;
  end: number;
}

class SetRateForRoomBody {
  @IsNumber()
  rateId: number;
  @IsNumber()
  start: number;
  @IsNumber()
  end: number;
}

class CountAmountDTO {
  @ApiProperty()
  rooms: Array<number>;

  @ApiProperty()
  check_in: number;

  @ApiProperty()
  check_out: number;
}

export {
  CreateRateDTO,
  BindRateForRoomDTO,
  UnbindRateFromRoomDTO,
  CheckIsRateBindableDTO,
  SetRateForRoomBody,
  CountAmountDTO,
};
