import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto, CreatePersonFilesDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsEntity } from './entities/news.entity';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { FilesService } from '../files/files.service';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from '../common/interceptors';
import { Files } from '../files/files.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly fileService: FilesService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: CreateNewsDto) {
    try {
      const data = await this.newsService.createNews(body);
      return data;
    } catch (error) {
      console.error('Error creating news:', error);
      throw 'Failed to create news';
    }
  }

  @Post(":id/media")
  @UseGuards(JwtAuthGuard)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    AnyFilesInterceptor(),
    MultipartFilesTransformingInterceptor,
  )
  async uploadMedia(
    @Param('id') id: number,
    @UploadedFiles()
    files: {
      images?: UploadedFileType | UploadedFileType[];
    },
  ) {
    const news = await this.newsService.findOne(id);
    let uploadedImages: Files[] | undefined = undefined;
    if (!news) {
      throw new NotFoundException(`Новость с ID ${id} не найдена`);
    }
    const images = files?.images
      ? Array.isArray(files.images)
        ? files.images
        : [files.images]
      : [];
    if (images.length > 0) {
      uploadedImages = await this.fileService.uploadMany(images);
    }
    console.log('Uploaded files:', files);
    console.log(files);

    return await this.newsService.setMediaById(news, {
      images: uploadedImages,
    });
  }

  @Get(':id')
  async findNewsById(@Param('id') id: number): Promise<NewsEntity | null> {
    const news = await this.newsService.findOne(id);
    if (!news) {
      throw new NotFoundException(`Новость с ID ${id} не найдена`);
    }
    return news;
  }

  @Get()
  async findAll() {
    return await this.newsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() body: UpdateNewsDto) {
    return await this.newsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: number) {
    await this.newsService.delete(id);
  }
}
