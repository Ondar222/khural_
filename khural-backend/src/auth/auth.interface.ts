import { IAccountability } from '../lib/types';
import { ApiResponses } from '../lib/types/api';
import {
  AuthLoginByEmailDTO,
  AuthLoginByPhoneDTO,
  AuthRefreshDto,
} from './dto';
import * as Express from 'express';

export type IUserCredentials = {
  access_token: string;
  expires: number;
  refresh_token: string;
  refresh_expire_date: number;
  user: string;
};

export interface IAuthController {
  loginByPhone: (
    headers: Express.Request['headers'],
    ip: string,
    body: AuthLoginByPhoneDTO,
  ) => Promise<ApiResponses<IUserCredentials>>;
  loginByEmail: (
    headers: Express.Request['headers'],
    ip: string,
    body: AuthLoginByEmailDTO,
  ) => Promise<ApiResponses<IUserCredentials>>;

  refreshToken: (
    headers: Express.Request['headers'],
    ip: string,
    body: AuthRefreshDto,
  ) => Promise<ApiResponses<IUserCredentials>>;
}

export interface IAuthService {
  login: (accountability: IAccountability) => IUserCredentials;
  createAccessToken: (
    accountability: IAccountability,
  ) => Pick<IUserCredentials, 'access_token' | 'expires'>;
  createRefreshToken: () => Pick<
    IUserCredentials,
    'refresh_token' | 'refresh_expire_date'
  >;
}
