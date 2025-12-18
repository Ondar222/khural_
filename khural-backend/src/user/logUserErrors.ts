import { BadRequestException, ConflictException } from '@nestjs/common';
import { MongoLoggerService } from '../logger';

export const logUserErrors = (
  e: unknown,
  body: unknown,
  logger: MongoLoggerService,
) => {
  if (e instanceof BadRequestException) {
    logger.error(
      'Пользователь не смог создать аккаунт, введены некорректные данные',
      {
        error: {
          name: e.name,
          message: e.message,
          status: e.getStatus(),
        },
        body: body,
      },
    );
  }

  if (e instanceof ConflictException) {
    logger.error(
      'Пользователь не смог создать аккаунт, пользователь уже существует',
      {
        error: {
          name: e.name,
          message: e.message,
          status: e.getStatus(),
        },
        body: body,
      },
    );
  }
};
