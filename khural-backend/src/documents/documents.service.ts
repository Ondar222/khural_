import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { DocumentEntity, DocumentType } from './entities/document.entity';
import { DocumentCategoryEntity } from './entities/document-category.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { FilesService } from '../files/files.service';
import { Files } from '../files/files.entity';
import { DocumentsRepository } from './documents.repository';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    @InjectRepository(DocumentCategoryEntity)
    private readonly categoryRepository: Repository<DocumentCategoryEntity>,
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreateDocumentDto): Promise<DocumentEntity> {
    let category: DocumentCategoryEntity | null = null;
    if (dto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID ${dto.categoryId} not found`,
        );
      }
    }

    let pdfFile: Files | null = null;
    if (dto.pdfFileId) {
      try {
        pdfFile = await this.filesService.findOne(dto.pdfFileId);
      } catch (error) {
        throw new NotFoundException(
          `PDF file with ID ${dto.pdfFileId} not found`,
        );
      }
    }

    let publishedAt: Date | null = null;
    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    }

    // Проверка уникальности номера и типа
    if (dto.number && dto.type) {
      const existing = await this.documentsRepository.findOne({
        where: { number: dto.number, type: dto.type },
      });
      if (existing) {
        throw new BadRequestException(
          `Document with number ${dto.number} and type ${dto.type} already exists`,
        );
      }
    }

    const document = this.documentsRepository.create({
      title: dto.title,
      number: dto.number,
      type: dto.type,
      content: dto.content,
      category,
      pdfFile,
      metadata: dto.metadata,
      publishedAt,
      isPublished: dto.isPublished ?? false,
    });

    const savedDocument = await this.documentsRepository.save(document);
    return this.findOne(savedDocument.id);
  }

  async findAll(filters?: SearchDocumentDto) {
    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.pdfFile', 'pdfFile');

    if (filters?.query) {
      const searchQuery = `%${filters.query}%`;
      queryBuilder.andWhere(
        '(document.title ILIKE :query OR document.number ILIKE :query OR document.content ILIKE :query)',
        { query: searchQuery },
      );
    }

    if (filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters?.types && filters.types.length > 0) {
      queryBuilder.andWhere('document.type IN (:...types)', {
        types: filters.types,
      });
    }

    if (filters?.year) {
      queryBuilder.andWhere(
        'EXTRACT(YEAR FROM document.publishedAt) = :year',
        { year: filters.year },
      );
    }

    if (filters?.dateFrom) {
      queryBuilder.andWhere('document.publishedAt >= :dateFrom', {
        dateFrom: new Date(filters.dateFrom),
      });
    }

    if (filters?.dateTo) {
      queryBuilder.andWhere('document.publishedAt <= :dateTo', {
        dateTo: new Date(filters.dateTo),
      });
    }

    queryBuilder.andWhere('document.isPublished = :isPublished', {
      isPublished: true,
    });

    queryBuilder.orderBy('document.publishedAt', 'DESC');

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchFullText(query: string, filters?: SearchDocumentDto) {
    // Используем полнотекстовый поиск PostgreSQL
    const queryBuilder = this.documentsRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.pdfFile', 'pdfFile')
      .where('document.isPublished = :isPublished', { isPublished: true });

    // Создаем tsvector для поиска
    queryBuilder.andWhere(
      `(
        to_tsvector('russian', COALESCE(document.title, '')) ||
        to_tsvector('russian', COALESCE(document.number, '')) ||
        to_tsvector('russian', COALESCE(document.content, ''))
      ) @@ plainto_tsquery('russian', :query)`,
      { query },
    );

    if (filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters?.types && filters.types.length > 0) {
      queryBuilder.andWhere('document.type IN (:...types)', {
        types: filters.types,
      });
    }

    if (filters?.year) {
      queryBuilder.andWhere(
        'EXTRACT(YEAR FROM document.publishedAt) = :year',
        { year: filters.year },
      );
    }

    // Ранжирование результатов
    queryBuilder.addSelect(
      `ts_rank(
        to_tsvector('russian', COALESCE(document.title, '')) ||
        to_tsvector('russian', COALESCE(document.number, '')) ||
        to_tsvector('russian', COALESCE(document.content, '')),
        plainto_tsquery('russian', :query)
      )`,
      'rank',
    );

    queryBuilder.orderBy('rank', 'DESC');
    queryBuilder.addOrderBy('document.publishedAt', 'DESC');

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query,
    };
  }

  async findOne(id: number): Promise<DocumentEntity> {
    const document = await this.documentsRepository.findOne({
      where: { id },
      relations: ['category', 'pdfFile'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async update(
    id: number,
    dto: UpdateDocumentDto,
  ): Promise<DocumentEntity> {
    const document = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        document.category = null;
      } else {
        const category = await this.categoryRepository.findOne({
          where: { id: dto.categoryId },
        });
        if (!category) {
          throw new NotFoundException(
            `Category with ID ${dto.categoryId} not found`,
          );
        }
        document.category = category;
      }
    }

    if (dto.pdfFileId !== undefined) {
      if (dto.pdfFileId === null) {
        document.pdfFile = null;
      } else {
        try {
          document.pdfFile = await this.filesService.findOne(dto.pdfFileId);
        } catch (error) {
          throw new NotFoundException(
            `PDF file with ID ${dto.pdfFileId} not found`,
          );
        }
      }
    }

    if (dto.publishedAt !== undefined) {
      document.publishedAt = dto.publishedAt
        ? new Date(dto.publishedAt)
        : null;
    }

    Object.assign(document, {
      title: dto.title ?? document.title,
      number: dto.number ?? document.number,
      type: dto.type ?? document.type,
      content: dto.content ?? document.content,
      metadata: dto.metadata ?? document.metadata,
      isPublished: dto.isPublished ?? document.isPublished,
    });

    const savedDocument = await this.documentsRepository.save(document);
    return this.findOne(savedDocument.id);
  }

  async delete(id: number): Promise<void> {
    const document = await this.findOne(id);

    if (document.pdfFile?.id) {
      await this.filesService.delete(document.pdfFile.id);
    }

    await this.documentsRepository.remove(document);
  }

  // CRUD для категорий документов
  async getAllCategories(): Promise<DocumentCategoryEntity[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { order: 'ASC' },
    });
  }

  async createCategory(
    name: string,
    parentId?: number,
    order?: number,
  ): Promise<DocumentCategoryEntity> {
    let parent: DocumentCategoryEntity | null = null;
    if (parentId) {
      parent = await this.categoryRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category with ID ${parentId} not found`,
        );
      }
    }

    const category = this.categoryRepository.create({
      name,
      parent,
      order: order ?? 0,
    });

    return this.categoryRepository.save(category);
  }

  async updateCategory(
    id: number,
    name?: string,
    parentId?: number,
    order?: number,
  ): Promise<DocumentCategoryEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.categoryRepository.findOne({
          where: { id: parentId },
        });
        if (!parent) {
          throw new NotFoundException(
            `Parent category with ID ${parentId} not found`,
          );
        }
        category.parent = parent;
      }
    }

    if (name !== undefined) category.name = name;
    if (order !== undefined) category.order = order;

    return this.categoryRepository.save(category);
  }

  async deleteCategory(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with children. Delete or move children first.',
      );
    }

    await this.categoryRepository.remove(category);
  }
}

