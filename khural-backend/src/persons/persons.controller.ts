import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseIntPipe,
  Put,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiConsumes } from '@nestjs/swagger';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from '../common/interceptors';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('persons')
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createPersonDto: CreatePersonDto,
  ) {
    return this.personsService.create(createPersonDto);
  }

  @Get()
  findAll() {
    return this.personsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: Partial<CreatePersonDto>) {
    return this.personsService.update(id, body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: CreatePersonDto) {
    return this.personsService.update(id, body);
  }

  @Get('faction/:faction')
  getByFaction(@Param('faction') faction: string) {
    return this.personsService.getFaction(faction);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(), MultipartFilesTransformingInterceptor)
  async uploadMedia(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: { image?: UploadedFileType },
  ) {
    const image = files?.image;
    return this.personsService.update(id, {}, image);
  }


  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.personsService.remove(id);
  }
}