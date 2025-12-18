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
import { AboutService } from './about.service';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { AuthGuard } from '../common/guards';
import { Locale } from '../common/interfaces/localizable.interface';

@ApiTags('about')
@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  // Pages
  @Post('pages')
  @ApiOperation({ summary: 'Создать страницу (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createPage(
    @Accountability() accountability: IAccountability,
    @Body() body: any,
  ) {
    this.ensureAdmin(accountability);
    return this.aboutService.createPage(body);
  }

  @Get('pages')
  @ApiOperation({ summary: 'Получить все страницы' })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  async findAllPages(@Query('locale') locale?: Locale) {
    return this.aboutService.findAllPages(locale);
  }

  @Get('pages/:slug')
  @ApiOperation({ summary: 'Получить страницу по slug' })
  @ApiQuery({ name: 'locale', required: false, enum: Locale })
  async findPageBySlug(
    @Param('slug') slug: string,
    @Query('locale') locale?: Locale,
  ) {
    return this.aboutService.findPageBySlug(slug, locale);
  }

  @Patch('pages/:id')
  @ApiOperation({ summary: 'Обновить страницу (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async updatePage(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: any,
  ) {
    this.ensureAdmin(accountability);
    return this.aboutService.updatePage(id, body);
  }

  @Delete('pages/:id')
  @ApiOperation({ summary: 'Удалить страницу (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async deletePage(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.aboutService.deletePage(id);
  }

  // Structure
  @Post('structure')
  @ApiOperation({ summary: 'Создать элемент структуры (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async createStructureItem(
    @Accountability() accountability: IAccountability,
    @Body() body: any,
  ) {
    this.ensureAdmin(accountability);
    return this.aboutService.createStructureItem(body);
  }

  @Get('structure')
  @ApiOperation({ summary: 'Получить структуру органов управления' })
  async findAllStructureItems() {
    return this.aboutService.findAllStructureItems();
  }

  @Patch('structure/:id')
  @ApiOperation({ summary: 'Обновить элемент структуры (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async updateStructureItem(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: any,
  ) {
    this.ensureAdmin(accountability);
    return this.aboutService.updateStructureItem(id, body);
  }

  @Delete('structure/:id')
  @ApiOperation({ summary: 'Удалить элемент структуры (только для администраторов)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async deleteStructureItem(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.aboutService.deleteStructureItem(id);
  }
}

