import { ApiProperty } from '@nestjs/swagger';

export enum ObtainingType {
  Self,
  Delivery,
  Onsite,
}

export class ProductOrder {
  @ApiProperty()
  dishes: Dish[];

  @ApiProperty()
  obtaining_type: ObtainingType;

  @ApiProperty()
  available_in?: number;
}

export class Dish {
  @ApiProperty()
  id: number;

  @ApiProperty()
  quantity: number;
}
