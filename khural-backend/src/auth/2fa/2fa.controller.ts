import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TwoFactorAuthService } from './2fa.service';
import { Accountability } from '../../common/decorators';
import { IAccountability } from '../../lib/types';
import { AuthGuard } from '../../common/guards';

@ApiTags('2fa')
@Controller('2fa')
export class TwoFAController {
  constructor(private readonly twoFAService: TwoFactorAuthService) {}

  @Get('status')
  @ApiOperation({ summary: 'Проверить, включена ли 2FA для пользователя' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getStatus(@Accountability() accountability: IAccountability) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    const isEnabled = await this.twoFAService.is2FAEnabled(accountability.user);
    return { isEnabled };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Сгенерировать секрет для 2FA' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async generateSecret(@Accountability() accountability: IAccountability) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    return this.twoFAService.generateSecret(accountability.user);
  }

  @Post('enable')
  @ApiOperation({ summary: 'Включить 2FA (требуется токен для подтверждения)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async enable(
    @Accountability() accountability: IAccountability,
    @Body() body: { token: string },
  ) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    const success = await this.twoFAService.enable2FA(
      accountability.user,
      body.token,
    );
    if (!success) {
      throw new ForbiddenException('Неверный токен');
    }
    return { success: true, message: '2FA успешно включена' };
  }

  @Delete('disable')
  @ApiOperation({ summary: 'Отключить 2FA' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async disable(@Accountability() accountability: IAccountability) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    await this.twoFAService.disable2FA(accountability.user);
    return { success: true, message: '2FA отключена' };
  }
}

