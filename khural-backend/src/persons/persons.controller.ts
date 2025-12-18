import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { MultipartFilesTransformingInterceptor, UploadedFile as UploadedFileType } from '../common/interceptors';
import { PersonEntity } from './entities/person.entity';
import { DeclarationType } from './entities/declaration.entity';
import {
  CreateCategoryDto,
  CreateConvocationDto,
  CreateDistrictDto,
  CreateFactionDto,
} from './dto/create-category.dto';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';

@ApiTags('persons')
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать нового депутата (только для администраторов)' })
  @ApiBearerAuth()
  create(
    @Accountability() accountability: IAccountability,
    @Body() createPersonDto: CreatePersonDto,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.create(createPersonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список депутатов с фильтрацией' })
  @ApiQuery({ name: 'districtId', required: false, description: 'Фильтр по ID округа', type: Number })
  @ApiQuery({ name: 'convocationId', required: false, description: 'Фильтр по ID созыва', type: Number })
  @ApiQuery({ name: 'factionId', required: false, description: 'Фильтр по ID фракции', type: Number })
  findAll(
    @Query('districtId') districtId?: string,
    @Query('convocationId') convocationId?: string,
    @Query('factionId') factionId?: string,
  ) {
    return this.personsService.findAll({ 
      districtId: districtId ? parseInt(districtId) : undefined,
      convocationId: convocationId ? parseInt(convocationId) : undefined,
      factionId: factionId ? parseInt(factionId) : undefined,
    });
  }


  @Get('categories/all')
  @ApiOperation({ summary: 'Получить список всех категорий (для просмотра доступных categoryIds)' })
  getAllCategories() {
    return this.personsService.getAllCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить данные депутата по ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить данные депутата (только для администраторов)' })
  @ApiBearerAuth()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.update(id, updatePersonDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Полное обновление данных депутата (только для администраторов)' })
  @ApiBearerAuth()
  updateFull(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() updatePersonDto: UpdatePersonDto,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.update(id, updatePersonDto);
  }

  @Post(':id/media')
  @ApiOperation({ summary: 'Загрузить фотографию депутата (только для администраторов)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'), MultipartFilesTransformingInterceptor)
  @ApiBearerAuth()
  async uploadFile(
    @UploadedFile() file: UploadedFileType,
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.update(id, {}, file);
  }

  @Post(':id/declarations')
  @ApiOperation({ 
    summary: 'Добавить декларацию о доходах или имуществе (PDF файл) (только для администраторов)',
    description: 'Загрузка PDF файла декларации. Поддерживаются декларации о доходах (income) и имуществе (assets).'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['pdf', 'type'],
      properties: {
        pdf: {
          type: 'string',
          format: 'binary',
          description: 'PDF файл декларации (обязательно, только PDF формат)',
        },
        type: {
          type: 'string',
          enum: [DeclarationType.INCOME, DeclarationType.ASSETS],
          description: 'Тип декларации: income (доходы) или assets (имущество) - обязательно',
          example: DeclarationType.INCOME,
        },
        year: {
          type: 'string',
          description: 'Год декларации (например: 2024)',
          example: '2024',
        },
        description: {
          type: 'string',
          description: 'Описание или название декларации',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('pdf'), MultipartFilesTransformingInterceptor)
  @ApiBearerAuth()
  async uploadDeclaration(
    @UploadedFile() file: UploadedFileType,
    @Param('id', ParseIntPipe) id: number,
    @Body('type') type: DeclarationType,
    @Body('year') year?: string,
    @Body('description') description?: string,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.addDeclaration(id, type, file, year, description);
  }

  @Get(':id/declarations')
  @ApiOperation({ 
    summary: 'Получить все PDF декларации депутата',
    description: 'Возвращает список всех деклараций (доходы и имущество) с ссылками на PDF файлы'
  })
  getDeclarations(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.getDeclarations(id);
  }

  @Delete(':id/declarations/:declarationId')
  @ApiOperation({ summary: 'Удалить декларацию (только для администраторов)' })
  @ApiBearerAuth()
  deleteDeclaration(
    @Param('id', ParseIntPipe) id: number,
    @Param('declarationId', ParseIntPipe) declarationId: number,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.deleteDeclaration(declarationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить депутата (только для администраторов)' })
  @ApiBearerAuth()
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.remove(id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Создать новую категорию (только для администраторов)' })
  @ApiBearerAuth()
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.createCategory(createCategoryDto.name);
  }

  // Фракции
  @Get('factions/all')
  @ApiOperation({ summary: 'Получить все фракции' })
  getAllFactions() {
    return this.personsService.getAllFactions();
  }

  @Post('factions')
  @ApiOperation({ summary: 'Создать новую фракцию (только для администраторов)' })
  @ApiBearerAuth()
  createFaction(
    @Body() createFactionDto: CreateFactionDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.createFaction(createFactionDto.name);
  }

  @Put('factions/:id')
  @ApiOperation({ summary: 'Обновить фракцию (только для администраторов)' })
  @ApiBearerAuth()
  updateFaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() createFactionDto: CreateFactionDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.updateFaction(id, createFactionDto.name);
  }

  @Delete('factions/:id')
  @ApiOperation({ summary: 'Удалить фракцию (только для администраторов)' })
  @ApiBearerAuth()
  deleteFaction(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.deleteFaction(id);
  }

  // Округа
  @Get('districts/all')
  @ApiOperation({ summary: 'Получить все округа' })
  getAllDistricts() {
    return this.personsService.getAllDistricts();
  }

  @Post('districts')
  @ApiOperation({ summary: 'Создать новый округ (только для администраторов)' })
  @ApiBearerAuth()
  createDistrict(
    @Body() createDistrictDto: CreateDistrictDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.createDistrict(createDistrictDto.name);
  }

  @Put('districts/:id')
  @ApiOperation({ summary: 'Обновить округ (только для администраторов)' })
  @ApiBearerAuth()
  updateDistrict(
    @Param('id', ParseIntPipe) id: number,
    @Body() createDistrictDto: CreateDistrictDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.updateDistrict(id, createDistrictDto.name);
  }

  @Delete('districts/:id')
  @ApiOperation({ summary: 'Удалить округ (только для администраторов)' })
  @ApiBearerAuth()
  deleteDistrict(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.deleteDistrict(id);
  }

  // Созывы
  @Get('convocations/all')
  @ApiOperation({ summary: 'Получить все созывы' })
  getAllConvocations() {
    return this.personsService.getAllConvocations();
  }

  @Post('convocations')
  @ApiOperation({ summary: 'Создать новый созыв (только для администраторов)' })
  @ApiBearerAuth()
  createConvocation(
    @Body() createConvocationDto: CreateConvocationDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.createConvocation(createConvocationDto.name);
  }

  @Put('convocations/:id')
  @ApiOperation({ summary: 'Обновить созыв (только для администраторов)' })
  @ApiBearerAuth()
  updateConvocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() createConvocationDto: CreateConvocationDto,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.updateConvocation(id, createConvocationDto.name);
  }

  @Delete('convocations/:id')
  @ApiOperation({ summary: 'Удалить созыв (только для администраторов)' })
  @ApiBearerAuth()
  deleteConvocation(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability?: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.personsService.deleteConvocation(id);
  }
}