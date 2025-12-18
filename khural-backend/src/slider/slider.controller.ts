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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { SliderService } from './slider.service';
import { CreateSliderItemDto } from './dto/create-slider-item.dto';
import { UpdateSliderItemDto } from './dto/update-slider-item.dto';
import { Accountability } from '../common/decorators';
import { IAccountability } from '../lib/types';
import { RolesHelper } from '../common/utils/roles';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from '../common/interceptors';
import { FilesService } from '../files/files.service';

@ApiTags('slider')
@Controller('slider')
export class SliderController {
  constructor(
    private readonly sliderService: SliderService,
    private readonly filesService: FilesService,
  ) {}

  private ensureAdmin(accountability?: IAccountability) {
    if (!accountability || !RolesHelper.isAdmin(accountability.role)) {
      throw new ForbiddenException('Недостаточно прав');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый слайд (только для администраторов)' })
  @ApiBearerAuth()
  async create(
    @Accountability() accountability: IAccountability,
    @Body() body: CreateSliderItemDto,
  ) {
    this.ensureAdmin(accountability);
    return this.sliderService.create(body);
  }

  @Post(':id/image')
  @ApiOperation({ summary: 'Загрузить изображение для слайда (только для администраторов)' })
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
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: UploadedFileType,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);

    if (!file) {
      throw new ForbiddenException('Изображение не предоставлено');
    }

    const uploadedFile = await this.filesService.upload(file);
    return this.sliderService.update(id, { imageId: uploadedFile.id });
  }

  @Get()
  @ApiOperation({ summary: 'Получить список слайдов' })
  @ApiQuery({ name: 'all', required: false, type: Boolean, description: 'Показать все слайды, включая неактивные' })
  async findAll(@Query('all') all?: string) {
    return this.sliderService.findAll(all !== 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить детальную информацию о слайде' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sliderService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить слайд (только для администраторов)' })
  @ApiBearerAuth()
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
    @Body() body: UpdateSliderItemDto,
  ) {
    this.ensureAdmin(accountability);
    return this.sliderService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить слайд (только для администраторов)' })
  @ApiBearerAuth()
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Accountability() accountability: IAccountability,
  ) {
    this.ensureAdmin(accountability);
    await this.sliderService.delete(id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Изменить порядок слайдов (только для администраторов)' })
  @ApiBearerAuth()
  async reorder(
    @Accountability() accountability: IAccountability,
    @Body() body: { ids: number[] },
  ) {
    this.ensureAdmin(accountability);
    return this.sliderService.reorder(body.ids);
  }
}

