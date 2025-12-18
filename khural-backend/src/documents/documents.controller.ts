import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from "@nestjs/common";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import {
  MultipartFilesTransformingInterceptor,
  UploadedFile as UploadedFileType,
} from "../common/interceptors";
import { DocumentsService } from "./documents.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("documents")
@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.documentsService.remove(id);
  }

  @Post(":id/file")
  @UseGuards(JwtAuthGuard)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(AnyFilesInterceptor(), MultipartFilesTransformingInterceptor)
  upload(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFiles() files: { file?: UploadedFileType },
  ) {
    if (!files?.file) return this.documentsService.findOne(id);
    return this.documentsService.attachFile(id, files.file);
  }
}





