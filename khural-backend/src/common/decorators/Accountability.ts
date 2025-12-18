import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

const Accountability = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.accountability;
});

export { Accountability };
