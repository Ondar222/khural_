import { ApiProperty } from "@nestjs/swagger";

class UserSearchDta {
  @ApiProperty({ required: false })
  id?: string;
  @ApiProperty({ required: false })
  email?: string;
  @ApiProperty({ required: false })
  phone?: string;
  @ApiProperty()
  many?: string;
}

export { UserSearchDta };