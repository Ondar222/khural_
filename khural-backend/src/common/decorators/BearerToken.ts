import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const BearerToken = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();

  return request.token;
});

export { BearerToken };
