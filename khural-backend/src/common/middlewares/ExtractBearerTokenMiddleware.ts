import { NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

export class ExtractBearerTokenMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: (error?: any) => void) {
    const authorization = req?.headers?.authorization;
    if (authorization == undefined) {
      return next();
    }
    const [type, token] = authorization.split(' ');
    switch (type) {
      case 'Bearer':
        req.token = token;
        break;
      default:
        req.token = null;
        break;
    }

    next();
  }
}
