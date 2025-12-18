import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Ip,
  Param,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { SessionService } from '../../session/session.service';
import * as Express from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { DateFormatter, PasswordHelper } from '../../common/utils';
import { EUserRole } from '../../lib/types/user-role';
import {
  AuthLoginByEmailDTO,
  AuthLoginByPhoneDTO,
  AuthRefreshDto,
} from '../dto';
import { IAuthController, IUserCredentials } from '../auth.interface';
import { ApiResponses } from '../../lib/types/api';
import { AuthResetPasswordDTO } from '../dto/auth.forgot-password';
import * as cache from 'cache-manager';
import { genNormalizePhone } from '../../common/utils/phone';
import crypto from 'crypto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { sign } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import {
  EAppScope,
  IAccountability,
} from '../../lib/types';

@ApiTags('authorization')
@Controller('auth')
export class AuthController implements IAuthController {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: cache.Cache,
    private authService: AuthService,
    private userService: UserService,
    private sessionService: SessionService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  @ApiBody({ type: AuthLoginByPhoneDTO })
  @Post('/login')
  async loginByPhone(
    @Headers() headers: Express.Request['headers'],
    @Ip() ip: string,
    @Body() body: AuthLoginByPhoneDTO,
  ): Promise<ApiResponses<IUserCredentials>> {
    try {
      let credentials: IUserCredentials;
      body.phone = genNormalizePhone(body.phone);
      const { phone } = body;

      // const codeVerification = await this.otpService.verifyCodeOrFail(
      //   code,
      //   phone,
      // );
      // if (!codeVerification) {
      //   throw new BadRequestException('СМС-код не совпадает или был просрочен');
      // }

      const user = await this.userService.findOne({ phone });
      if (typeof user === 'undefined') {
        throw new UnauthorizedException();
      }

      const accountability =
        await this.userService.createUserCredentials(user.id);

      credentials = this.authService.login(accountability);

      const session = await this.sessionService.create({
        token: credentials.refresh_token,
        user: user.id,
        expires: DateFormatter.toTimestampWTZ(
          Number(credentials.refresh_expire_date),
        ),
        ip: ip,
        user_agent: headers['user-agent'],
        origin: headers['host'],
      });

      return {
        data: credentials,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        // TODO: log to db
      }

      if (e instanceof BadRequestException) {
        // TODO: log to db
      }
      throw e;
    }
  }

  @ApiBody({ type: AuthLoginByEmailDTO })
  @Post("/login/password")
  async loginByEmail(
    @Headers() headers: Express.Request["headers"],
    @Ip() ip: string,
    @Body() body: AuthLoginByEmailDTO
  ): Promise<ApiResponses<IUserCredentials>> {
    try {
      // let credentials: IUserCredentials;
      const { email, password } = body;

      const user = await this.userService.checkUserLoginCredentials(
        email,
        password
      );

      const credentials = this.authService.login({
        user: user.id,
        admin: user.role.admin_access,
        app: user.role.app_access,
        role: user.role.id as EUserRole,
        scope: EAppScope.LANA_FOOD,
      });

      await this.sessionService.create({
        token: credentials.refresh_token,
        expires: DateFormatter.toTimestampWTZ(credentials.refresh_expire_date),
        user: user.id,
        ip: ip,
        user_agent: headers["user-agent"],
        origin: headers["host"],
      });

      return {
        data: credentials,
      };
    } catch (e) {
      if (e instanceof ForbiddenException) {
        // TODO: log to db
      }

      if (e instanceof BadRequestException) {
        // TODO: log to db
      }

      throw e;
    }
  }

  @ApiBearerAuth()
  @ApiBody({ type: AuthRefreshDto })
  @Post('/refresh')
  async refreshToken(
    @Headers() headers: Express.Request['headers'],
    @Ip() ip: string,
    @Body() body: AuthRefreshDto,
  ): Promise<ApiResponses<IUserCredentials>> {
    const { refresh } = body;
    const session = await this.sessionService.getByToken(refresh);

    if (!session) throw new UnauthorizedException();
    if (
      DateFormatter.toMomentWTZ(session.expires).isBefore(
        DateFormatter.toMomentWTZ(Math.floor(Date.now() / 1000)),
      )
    ) {
      throw new BadRequestException('refresh token expired');
    }

    const user = await this.userService.findOne({
      id: session.user,
    });

    if (!user) {
      throw new UnauthorizedException('user does not found');
    }

    const credentials = this.authService.login({
      user: user.id,
      admin: user.role.admin_access,
      app: user.role.app_access,
      role: user.role.id,
      scope: EAppScope.LANA_FOOD,
    });

    await this.sessionService.create({
      token: credentials.refresh_token,
      expires: DateFormatter.toTimestampWTZ(credentials.refresh_expire_date),
      user: user.id,
      ip: ip,
      user_agent: headers['user-agent'],
      origin: headers['host'],
    });

    await this.sessionService.update({
      token: refresh,
      expires: DateFormatter.toTimestampWTZ(Math.floor(Date.now() / 1000)),
    });

    return {
      data: credentials,
    };
  }

  @Post('/password/reset')
  async resetPassword(
    @Body() body: AuthResetPasswordDTO,
    @Res() res: Express.Response,
  ) {
    const { email } = body;
    const user = await this.userService.findOne({ email });
    if (user === undefined || user.role.id !== EUserRole.admin) {
      throw new ForbiddenException();
    }
    await this.authService.resetPassword(email);
    return res.sendStatus(201);
  }

  @Post('/password/reset/:id')
  async updatePassword(
    @Param('id') id: string,
    @Body() body: { email: string; password: string },
    @Res() res: Express.Response,
  ) {
    const { email, password } = body;
    const isEmailExists = await this.cacheManager.get<string>(email);

    if (!isEmailExists || isEmailExists != id) {
      throw new ForbiddenException();
    }
    const hashPassword = await PasswordHelper.hashPassword(password);
    await this.userService.updatePassword(email, hashPassword);
    return res.sendStatus(201);
  }


  @Get('/groupservices')
  async getServices() {
    const now = Date.now();
    const token = sign(
      {
        exp: now + 3600,
        iss: '51d7fb3b9cc18097376ead1f8230accb',
      },
      '102e83a819467652c9e6d1a22a2b77a9',
      {
        expiresIn: now + 3600,
        issuer: '',
      },
    );

    const services = await firstValueFrom(
      this.httpService.get(
        'https://newapi.archimed-soft.ru/api/v5/groupservices',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 20000,
        },
      ),
    );

    return services.data;
  }
}
