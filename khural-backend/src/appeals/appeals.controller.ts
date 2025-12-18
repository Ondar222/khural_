import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AppealsService } from './appeals.service';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealDto } from './dto/update-appeal.dto';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';

@ApiTags('appeals')
@Controller('appeals')
export class AppealsController {
  constructor(private readonly appealsService: AppealsService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новое обращение (требуется авторизация)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async create(
    @Accountability() accountability: IAccountability,
    @Body() body: CreateAppealDto,
  ) {
    if (!accountability?.user) {
      throw new ForbiddenException('Требуется авторизация');
    }
    return this.appealsService.create(body, accountability.user);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список обращений' })
  @ApiQuery({ name: 'statusId', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: Number })
  @ApiQuery({ name: 'dateTo', required: false, type: Number })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async findAll(
    @Accountability() accountability: IAccountability,
    @Query('statusId') statusId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const userId = accountability?.user;
    // Администраторы видят все обращения, пользователи - только свои
    const isAdmin = accountability && RolesHelper.isAdmin(accountability.role);
    
    return this.appealsService.findAll(
      isAdmin ? undefined : userId,
      {
        statusId: statusId ? parseInt(statusId) : undefined,
        dateFrom: dateFrom ? parseInt(dateFrom) : undefined,
        dateTo: dateTo ? parseInt(dateTo) : undefined,
      },
    );
  }

  @Get('statuses/all')
  @ApiOperation({ summary: 'Получить все статусы обращений' })
  getAllStatuses() {
    return this.appealsService.getAllStatuses();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию об обращении' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    const userId = accountability?.user;
    const isAdmin = accountability && RolesHelper.isAdmin(accountability.role);
    
    return this.appealsService.findOne(id, isAdmin ? undefined : userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Получить историю изменений обращения' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async getHistory(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    // Проверяем доступ к обращению
    const userId = accountability?.user;
    const isAdmin = accountability && RolesHelper.isAdmin(accountability.role);
    await this.appealsService.findOne(id, isAdmin ? undefined : userId);
    
    return this.appealsService.getHistory(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить обращение (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: UpdateAppealDto,
  ) {
    this.ensureAdmin(accountability);
    
    if (!accountability.user) {
      throw new ForbiddenException('User ID not found');
    }
    
    return this.appealsService.update(id, body, accountability.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить обращение (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.appealsService.delete(id);
  }
}

