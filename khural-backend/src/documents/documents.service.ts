import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FilesService } from "../files/files.service";
import { UploadedFile } from "../common/interceptors";
import { DocumentEntity } from "./entities/document.entity";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentsRepo: Repository<DocumentEntity>,
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreateDocumentDto) {
    const doc = this.documentsRepo.create(dto);
    return await this.documentsRepo.save(doc);
  }

  async findAll() {
    return await this.documentsRepo.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: number) {
    const doc = await this.documentsRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Document with ID ${id} not found`);
    return doc;
  }

  async update(id: number, dto: UpdateDocumentDto) {
    const doc = await this.findOne(id);
    Object.assign(doc, dto);
    return await this.documentsRepo.save(doc);
  }

  async remove(id: number) {
    const doc = await this.findOne(id);
    if (doc.file?.id) await this.filesService.delete(doc.file.id);
    return await this.documentsRepo.remove(doc);
  }

  async attachFile(id: number, file: UploadedFile) {
    const doc = await this.findOne(id);
    if (doc.file?.id) await this.filesService.delete(doc.file.id);
    const uploaded = await this.filesService.upload(file);
    doc.file = uploaded;
    return await this.documentsRepo.save(doc);
  }
}




