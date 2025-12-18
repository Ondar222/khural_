import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { decode, JwtPayload, sign, verify } from 'jsonwebtoken';
import { IAuthService, IUserCredentials } from './auth.interface';
import { IAccountability } from '../lib/types';

import { TIMEZONE_NAME } from '../common/utils';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import * as cache from 'cache-manager';
import moment from 'moment';
import 'moment-timezone';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject('CACHE_MANAGER') private cacheManager: cache.Cache,
    private configService: ConfigService,
    private readonly userRepository: UserService,
  ) {}

  SECRET = this.configService.getOrThrow<string>('SECRET');
  ACCESS_TOKEN_TTL = Number(
    this.configService.get<string>('ACCESS_TOKEN_TTL') || 60,
  );


  login(accountability: IAccountability) {
    const { user } = accountability;
    const { refresh_token, refresh_expire_date } = this.createRefreshToken();
    const { access_token, expires } = this.createAccessToken(accountability);

    const data: IUserCredentials =
      {
      access_token,
      expires,
      refresh_token,
      refresh_expire_date,
        user
    };

    return data;
  }

  createRefreshToken(): Pick<
    IUserCredentials,
    'refresh_token' | 'refresh_expire_date'
  > {
    const refresh_token = v4();
    const now = Date.now();
    const year = 31104000000;
    const refresh_expire_date = moment(now + year)
      .tz(TIMEZONE_NAME)
      .unix();

    return { refresh_token, refresh_expire_date };
  }

  createAccessToken(
    accountability: IAccountability,
  ): Pick<IUserCredentials, 'access_token' | 'expires'> {
    const now = Date.now();
    const duration = moment.duration(this.ACCESS_TOKEN_TTL, 'minutes');

    const access_token: string = sign(
      {
        id: accountability.user,
        role: accountability.role,
        admin_access: accountability.admin,
        app_access: accountability.app,
        scope: accountability.scope,
      },
      this.SECRET,
      {
        expiresIn: duration.asSeconds(),
        issuer: '',
      },
    );

    const expires: number = now + duration.asMilliseconds();
    return { access_token, expires };
  }

  verifyAccessToken(token: string) {
    const verificationResult = verify(token, this.SECRET);
    return typeof verificationResult === 'object';
  }

  decodeAccessToken(token: string): JwtPayload | null {
    return decode(token, {
      json: true,
    });
  }

  async resetPassword(email: string) {
    const isEmailExists = await this.cacheManager.get(email);
    const uuid = v4();
    if (isEmailExists) {
      await this.cacheManager.set(email, uuid, 300000);
    }
    await this.cacheManager.set(email, uuid, 300000);
  }
}
