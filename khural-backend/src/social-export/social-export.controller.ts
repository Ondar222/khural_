import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SocialExportService } from './social-export.service';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';

@ApiTags('social-export')
@Controller('social-export')
export class SocialExportController {
  constructor(private readonly socialExportService: SocialExportService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post('news/:id/vk')
  @ApiOperation({ summary: 'Экспортировать новость в ВКонтакте (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async exportToVk(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.socialExportService.exportToVk(id);
  }

  @Post('news/:id/telegram')
  @ApiOperation({ summary: 'Экспортировать новость в Telegram (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async exportToTelegram(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.socialExportService.exportToTelegram(id);
  }

  @Post('news/:id/all')
  @ApiOperation({ summary: 'Экспортировать новость во все соцсети (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async exportToAll(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.socialExportService.exportToAll(id);
  }

  @Get('news/:id/history')
  @ApiOperation({ summary: 'Получить историю экспорта новости' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.socialExportService.getExportHistory(id);
  }
}

