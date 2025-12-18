import { NestMiddleware, Request, Response } from '@nestjs/common';
import * as Express from 'express';
import { decode } from 'jsonwebtoken';

export class AttachAccountabilityMiddleware implements NestMiddleware {
  constructor() {} // private sessionService: SessionService, // private userService: UserService,
  async use(
    @Request() req: Express.Request,
    @Response() _res: Express.Response,
    next: (error?: any) => void,
  ) {
    try {
      const token = req.token;

      if (typeof token != 'string') {
        next();
        return;
      }

      const payload = decode(token, {
        json: true,
      });

      req.accountability = {
        user: payload?.id,
        admin: payload?.admin_access,
        app: payload?.app_access,
        role: payload?.role,
        scope: payload?.scope,
      };

      next();
    } catch (e) {
      next();
    }
  }
}
