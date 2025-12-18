import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { NewsEntity } from './entities/news.entity';
import {
  AnyFilesInterceptor,
} from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from '../common/interceptors';
import { Files } from '../files/files.entity';
import { UploadedFiles } from '@nestjs/common';
import { Accountability, BearerToken } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly fileService: FilesService,
  ) {}

  private ensureAdmin(accountability?: IAccountability) {
    // eslint-disable-next-line no-console
    console.debug('[NewsController] accountability', accountability);
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post("/")
  @ApiOperation({ summary: 'Создать новую новость (только для администраторов)' })
  @ApiBearerAuth()
  async create(
    @BearerToken() token: string,
    @Accountability() accountability: IAccountability,
    @Body() body: CreateNewsDto,
  ) {

    this.ensureAdmin(accountability);
    console.log(accountability);
    return this.newsService.create(body);
  }

  @Post(':id/cover')
  @ApiOperation({ summary: 'Загрузить обложку новости (только для администраторов)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(), MultipartFilesTransformingInterceptor)
  async uploadCover(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { cover?: UploadedFileType[] },
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    const news = await this.newsService.findOne(id);
    if (!news) {
      throw new NotFoundException(`Новость с ID ${id} не найдена`);
    }
    if (files.cover && files.cover.length > 0) {
      const uploadedFile = await this.fileService.upload(files.cover[0]);
      return this.newsService.updateCoverImage(id, uploadedFile);
    }
    throw new NotFoundException('Файл обложки не предоставлен');
  }

  @Post(':id/gallery')
  @ApiOperation({ summary: 'Загрузить галерею для новости (только для администраторов)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(), MultipartFilesTransformingInterceptor)
  async uploadGallery(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { gallery?: UploadedFileType[] },
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    if (files.gallery && files.gallery.length > 0) {
      const uploadedFiles = await this.fileService.uploadMany(files.gallery);
      return this.newsService.addToGallery(id, uploadedFiles);
    }
    throw new NotFoundException('Файлы галереи не предоставлены');
  }

  @Get()
  @ApiOperation({ summary: 'Получить список новостей с фильтрацией' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Фильтр по ID категории', type: Number })
  @ApiQuery({ name: 'year', required: false, description: 'Фильтр по году публикации', type: Number })
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('year') year?: string,
  ) {
    return this.newsService.findAll({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о новости' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<NewsEntity> {
    return this.newsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить новость (только для администраторов)' })
  @ApiBearerAuth()
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.newsService.delete(id);
  }

  @Get('categories/all')
  @ApiOperation({ summary: 'Получить все категории новостей' })
  getAllCategories() {
    return this.newsService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Создать новую категорию новостей (только для администраторов)' })
  @ApiBearerAuth()
  createCategory(
    @Body() body: { name: string },
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.newsService.createCategory(body.name);
  }
}
