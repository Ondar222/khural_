import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { RolesHelper } from '../utils/roles';

class HotelRole implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    if (!req.accountability)
      throw new HttpException(
        'you have not permissions to do this',
        HttpStatus.FORBIDDEN,
      );

    const { role } = req?.accountability;
    if (RolesHelper.isHotel(role)) {
      return true;
    }
    throw new HttpException(
      'you have not permissions to do this',
      HttpStatus.FORBIDDEN,
    );
  }
}

class TouristRole implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    if (!req.accountability)
      throw new HttpException(
        'you have not permissions to do this',
        HttpStatus.FORBIDDEN,
      );

    const { role } = req.accountability;
    if (RolesHelper.isTourist(role)) {
      return true;
    }
    throw new HttpException(
      'you have not permissions to do this',
      HttpStatus.FORBIDDEN,
    );
  }
}

export { HotelRole, TouristRole };
