import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { IAccountability } from '../lib/types/accountability';
import { UserSearchDta } from './dta/find.dta';
import { UserEntity } from './entity/user.entity';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.userService.create(createUserDto);
    } catch (e) {
      throw e;
    }
  }

  // @ApiBearerAuth()
  // @UseGuards()
  // @Get("/find")
  // async findOne(
  //   @Accountability() accountability: IAccountability,
  //   @Query() query: UserSearchDta
  // ) {
  //   try {
  //     let data: UserEntity | UserEntity[] | undefined;
  //
  //     if (query.many === "true") {
  //       data = await this.userService.findMany(query);
  //     } else {
  //       data = await this.userService.findOne(query);
  //     }
  //
  //     return { data };
  //   } catch (e) {
  //     // this.logger.error("could not find user", {
  //     // 	user: accountability.user,
  //     // 	query: query,
  //     // });
  //     throw e;
  //   }
  // }


}
