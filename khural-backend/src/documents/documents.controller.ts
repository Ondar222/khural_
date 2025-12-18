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
  UseGuards,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from '../common/interceptors';
import { FilesService } from '../files/files.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly filesService: FilesService,
  ) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый документ (только для администраторов)' })
  @ApiBearerAuth()
  async create(
    @Accountability() accountability: IAccountability,
    @Body() body: CreateDocumentDto,
  ) {
    this.ensureAdmin(accountability);
    return this.documentsService.create(body);
  }

  @Post(':id/pdf')
  @ApiOperation({ summary: 'Загрузить PDF файл для документа (только для администраторов)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        pdf: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('pdf'), MultipartFilesTransformingInterceptor)
  @ApiBearerAuth()
  async uploadPdf(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileType,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    
    if (!file) {
      throw new ForbiddenException('PDF файл не предоставлен');
    }

    // Проверяем, что это PDF
    if (file.type && file.type !== 'application/pdf') {
      throw new ForbiddenException('Допускается только загрузка PDF файлов');
    }

    if (file.filename_download && !file.filename_download.toLowerCase().endsWith('.pdf')) {
      throw new ForbiddenException('Допускается только загрузка PDF файлов');
    }

    const uploadedFile = await this.filesService.upload(file);
    return this.documentsService.update(id, { pdfFileId: uploadedFile.id });
  }

  @Get()
  @ApiOperation({ summary: 'Получить список документов с фильтрацией и поиском' })
  @ApiQuery({ name: 'query', required: false, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['law', 'resolution', 'decision', 'order', 'other'] })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() filters: SearchDocumentDto) {
    if (filters.query) {
      return this.documentsService.searchFullText(filters.query, filters);
    }
    return this.documentsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о документе' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить документ (только для администраторов)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: UpdateDocumentDto,
  ) {
    this.ensureAdmin(accountability);
    return this.documentsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить документ (только для администраторов)' })
  @ApiBearerAuth()
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.documentsService.delete(id);
  }

  // Категории документов
  @Get('categories/all')
  @ApiOperation({ summary: 'Получить все категории документов' })
  getAllCategories() {
    return this.documentsService.getAllCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Создать новую категорию документов (только для администраторов)' })
  @ApiBearerAuth()
  createCategory(
    @Accountability() accountability: IAccountability,
    @Body() body: { name: string; parentId?: number; order?: number },
  ) {
    this.ensureAdmin(accountability);
    return this.documentsService.createCategory(
      body.name,
      body.parentId,
      body.order,
    );
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Обновить категорию документов (только для администраторов)' })
  @ApiBearerAuth()
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: { name?: string; parentId?: number; order?: number },
  ) {
    this.ensureAdmin(accountability);
    return this.documentsService.updateCategory(
      id,
      body.name,
      body.parentId,
      body.order,
    );
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Удалить категорию документов (только для администраторов)' })
  @ApiBearerAuth()
  deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    return this.documentsService.deleteCategory(id);
  }
}

