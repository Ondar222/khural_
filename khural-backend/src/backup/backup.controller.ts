import {
  Controller,
  Get,
  Post,
  Delete,
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
import { BackupService } from './backup.service';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';

@ApiTags('backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать резервную копию БД (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createBackup(@Accountability() accountability: IAccountability) {
    this.ensureAdmin(accountability);
    return this.backupService.createBackup();
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех бэкапов (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getAllBackups(@Accountability() accountability: IAccountability) {
    this.ensureAdmin(accountability);
    return this.backupService.getAllBackups();
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Восстановить БД из бэкапа (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async restoreBackup(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.backupService.restoreBackup(id);
    return { success: true };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить бэкап (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async deleteBackup(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.backupService.deleteBackup(id);
  }
}

