import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AccessibilityService } from './accessibility.service';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { AuthGuard } from '../common/guards';

@ApiTags('accessibility')
@Controller('accessibility')
export class AccessibilityController {
  constructor(private readonly accessibilityService: AccessibilityService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Получить настройки доступности' })
  @ApiQuery({ name: 'sessionId', required: false })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getSettings(
    @Accountability() accountability: IAccountability,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = accountability?.user;
    return this.accessibilityService.getSettings(userId, sessionId);
  }

  @Post('settings')
  @ApiOperation({ summary: 'Сохранить настройки доступности' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async saveSettings(
    @Accountability() accountability: IAccountability,
    @Body() body: {
      sessionId?: string;
      fontSize?: number;
      colorScheme?: string;
      contrast?: string;
      disableAnimations?: boolean;
    },
  ) {
    const userId = accountability?.user;
    return this.accessibilityService.saveSettings({
      userId,
      ...body,
    });
  }
}

