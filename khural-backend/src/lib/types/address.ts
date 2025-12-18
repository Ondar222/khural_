import { ApiProperty } from '@nestjs/swagger';

class Address {
  @ApiProperty({ required: false })
  postal_code: string;

  @ApiProperty({ required: false })
  country: string;

  @ApiProperty({ required: false })
  region: string;

  @ApiProperty({ required: false })
  settlement_type: string;

  @ApiProperty({ required: false })
  settlement: string;

  @ApiProperty({ required: false })
  street_type: string;

  @ApiProperty({ required: false })
  street: string;

  @ApiProperty({ required: false })
  house: string;

  @ApiProperty({ required: false })
  house_litera: string;

  @ApiProperty({ required: false })
  block: string;

  @ApiProperty({ required: false })
  latitude: number;

  @ApiProperty({ required: false })
  longitude: number;
}

export { Address };
