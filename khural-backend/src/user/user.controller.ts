import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import * as Express from 'express';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../session/session.service';
import { AuthGuard } from '../common/guards';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserCreateDto } from './dto/create.dto';
import { DateFormatter } from '../common/utils';
import { UserUpdateDto } from './dto/update.dto';
import { User } from './user.entity';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile,
} from '../common/interceptors';
import { Files } from '../files/files.entity';
import { FilesService } from '../files/files.service';
import { HotelRole } from '../common/guards';
import { UserSearchDta } from './dta/find.dta';
import { UserAvatarDto } from './dto/create.dto';
import { UserFactory } from './user.factory';
import { ApiResponses} from '../lib/types/api';
import { IUserCredentials } from '../auth/auth.interface';
// import {
//   HOTEL_DEFAULT_NAME,
//   RESTAURANT_DEFAULT_NAME,
// } from '../hotel/hotel.consts.ts';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types/';
import { genNormalizePhone } from '../common/utils/phone';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SessionCreationDto } from '../session/dto/dto';


@ApiTags('user')
@Controller('user')
export class UserController {

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private sessionService: SessionService,
    private filesService: FilesService,
    private userFactory: UserFactory,
  ) {
  }

  @ApiTags("sign up")
  @ApiBody({ type: UserCreateDto })
  @Post("/")
  async create(
    @Body() body: UserCreateDto,
    @Ip() ip: string,
    @Headers() headers: Express.Request["headers"]
  ): Promise<ApiResponses<IUserCredentials & { id: string }>> {
    try {
      body.phone = genNormalizePhone(body.phone);

      const newUser = await this.userFactory.create(body);

      const accountability = await this.userService.createUserCredentials(
        newUser.id
      );

      const data: IUserCredentials = this.authService.login(accountability);

      const sessionDto: SessionCreationDto = {
        token: data.refresh_token,
        user: accountability.user,
        expires: DateFormatter.toTimestampWTZ(data.refresh_expire_date),
        ip: ip,
        user_agent: headers["user-agent"],
        origin: headers["host"],
      };
      await this.sessionService.create(sessionDto);
      return { data: { ...data, id: newUser.id } };
    } catch (e: unknown) {
      throw e;
    }
  }

  @ApiBearerAuth()
  @UseGuards(HotelRole)
  @Get("/find")
  async findOne(
    @Accountability() accountability: IAccountability,
    @Query() query: UserSearchDta
  ) {
    try {
      let data: any;

      if (query.many === "true") {
        data = await this.userService.findMany(query);
      } else {
        data = await this.userService.findOne(query);
      }

      return { data };
    } catch (e) {
      // this.logger.error("could not find user", {
      // 	user: accountability.user,
      // 	query: query,
      // });
      throw e;
    }
  }

  // completed
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get("/me")
  async getMe(@Accountability() accountability: IAccountability) {
    const { user } = accountability;
    const data = await this.userService.findOne({
      id: user,
    });
    return { data };
  }

  // @Get("/:id")
  // async getUser(@Param('id') id: string) {
  //   return this.userService.findOne({ id: id })
  // }

  // completed
  @ApiBearerAuth()
  @ApiBody({ type: UserUpdateDto })
  @Patch("/me")
  async updateMe(
    @Accountability() accountability: IAccountability,
    @Body() body: UserUpdateDto
  ) {
    const { user: userId } = accountability;

    const data = await this.userService
      .update(body, userId)
      .then((res) => {
        // this.logger.info("user updated", {
        // 	metadata: {
        // 		action: "update",
        // 		user: userId,
        // 	},
        // });
        return res;
      })
      .catch((e) => {
        // this.logger.error("user update failed", {
        // 	error_message: JSON.stringify(e),
        // 	user: userId,
        // });
      });

    return { data };
  }

  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    type: UserAvatarDto,
  })
  @UseInterceptors(AnyFilesInterceptor(), MultipartFilesTransformingInterceptor)
  @Patch("/me/avatar")
  async uploadMyAvatar(
    @Accountability() accountability: IAccountability,
    @UploadedFiles()
    files: {
      avatar: UploadedFile;
    }
  ) {
    const { user } = accountability;
    console.log(files);
    const avatar = files.avatar;
    const file = await this.filesService.upload(avatar);
    const copyFile = new Files();
    copyFile.id = (file && file.id) || "";

    const data = await this.userService.updateAvatar(user, copyFile);
    return { data };
  }
}