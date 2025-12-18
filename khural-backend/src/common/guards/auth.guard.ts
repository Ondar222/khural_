import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { Observable } from 'rxjs';
import * as Express from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const SECRET = this.configService.getOrThrow<string>('SECRET', { infer: true });
      const req: Express.Request = context.switchToHttp().getRequest();
      const { token } = req;
      if (!token) throw new UnauthorizedException('token was not provided');

      const isAuth = verify(token, SECRET);
      if (typeof isAuth === 'object') return true;

      throw new UnauthorizedException('token is not valid');
    } catch (e) {
      throw new UnauthorizedException('jwt expired or not valid');
    }
  }
}

export { AuthGuard };
