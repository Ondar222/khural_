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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новое событие (только для администраторов)' })
  @ApiBearerAuth()
  async create(
    @Accountability() accountability: IAccountability,
    @Body() body: CreateEventDto,
  ) {
    this.ensureAdmin(accountability);
    return this.calendarService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список событий с фильтрацией' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', required: false, type: Number })
  @ApiQuery({ name: 'dateTo', required: false, type: Number })
  @ApiQuery({ name: 'eventTypeId', required: false, type: Number })
  async findAll(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('eventTypeId') eventTypeId?: string,
  ) {
    return this.calendarService.findAll({
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
      dateFrom: dateFrom ? parseInt(dateFrom) : undefined,
      dateTo: dateTo ? parseInt(dateTo) : undefined,
      eventTypeId: eventTypeId ? parseInt(eventTypeId) : undefined,
    });
  }

  @Get('month/:year/:month')
  @ApiOperation({ summary: 'Получить события за конкретный месяц' })
  async findByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.calendarService.findByMonth(year, month);
  }

  @Get('year/:year')
  @ApiOperation({ summary: 'Получить события за конкретный год' })
  async findByYear(@Param('year', ParseIntPipe) year: number) {
    return this.calendarService.findByYear(year);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о событии' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.calendarService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить событие (только для администраторов)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: UpdateEventDto,
  ) {
    this.ensureAdmin(accountability);
    return this.calendarService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить событие (только для администраторов)' })
  @ApiBearerAuth()
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.calendarService.delete(id);
  }

  // Типы событий
  @Get('types/all')
  @ApiOperation({ summary: 'Получить все типы событий' })
  getAllEventTypes() {
    return this.calendarService.getAllEventTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Создать новый тип события (только для администраторов)' })
  @ApiBearerAuth()
  createEventType(
    @Accountability() accountability: IAccountability,
    @Body() body: { name: string; color?: string },
  ) {
    this.ensureAdmin(accountability);
    return this.calendarService.createEventType(body.name, body.color);
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'Обновить тип события (только для администраторов)' })
  @ApiBearerAuth()
  updateEventType(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: { name?: string; color?: string },
  ) {
    this.ensureAdmin(accountability);
    return this.calendarService.updateEventType(id, body.name, body.color);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Удалить тип события (только для администраторов)' })
  @ApiBearerAuth()
  deleteEventType(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.calendarService.deleteEventType(id);
  }
}

