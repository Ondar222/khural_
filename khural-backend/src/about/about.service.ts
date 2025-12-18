import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageEntity } from './entities/page.entity';
import { StructureItemEntity } from './entities/structure-item.entity';
import { FilesService } from '../files/files.service';
import { Files } from '../files/files.entity';
import { Locale } from '../common/interfaces/localizable.interface';

@Injectable()
export class AboutService {
  constructor(
    @InjectRepository(PageEntity)
    private readonly pageRepository: Repository<PageEntity>,
    @InjectRepository(StructureItemEntity)
    private readonly structureRepository: Repository<StructureItemEntity>,
    private readonly filesService: FilesService,
  ) {}

  // Pages CRUD
  async createPage(dto: {
    slug: string;
    locale: Locale;
    title: string;
    content: string;
    imageIds?: string[];
    videos?: string[];
    order?: number;
  }): Promise<PageEntity> {
    let images: Files[] = [];
    if (dto.imageIds && dto.imageIds.length > 0) {
      images = await this.filesService.findMany(dto.imageIds);
    }

    const page = this.pageRepository.create({
      slug: dto.slug,
      locale: dto.locale,
      title: dto.title,
      content: dto.content,
      images,
      videos: dto.videos || [],
      order: dto.order || 0,
    });

    return this.pageRepository.save(page);
  }

  async findAllPages(locale?: Locale): Promise<PageEntity[]> {
    const where = locale ? { locale } : {};
    return this.pageRepository.find({
      where,
      relations: ['images'],
      order: { order: 'ASC' },
    });
  }

  async findPageBySlug(slug: string, locale?: Locale): Promise<PageEntity> {
    const where: any = { slug };
    if (locale) where.locale = locale;

    const page = await this.pageRepository.findOne({
      where,
      relations: ['images'],
    });

    if (!page) {
      throw new NotFoundException(`Page with slug "${slug}" not found`);
    }

    return page;
  }

  async updatePage(id: number, dto: Partial<{
    title: string;
    content: string;
    imageIds: string[];
    videos: string[];
    order: number;
  }>): Promise<PageEntity> {
    const page = await this.pageRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }

    if (dto.imageIds !== undefined) {
      page.images = await this.filesService.findMany(dto.imageIds);
    }

    Object.assign(page, {
      title: dto.title ?? page.title,
      content: dto.content ?? page.content,
      videos: dto.videos ?? page.videos,
      order: dto.order ?? page.order,
    });

    return this.pageRepository.save(page);
  }

  async deletePage(id: number): Promise<void> {
    const page = await this.pageRepository.findOne({ where: { id } });
    if (!page) {
      throw new NotFoundException(`Page with ID ${id} not found`);
    }
    await this.pageRepository.remove(page);
  }

  // Structure CRUD
  async createStructureItem(dto: {
    name: string;
    description?: string;
    parentId?: number;
    pageId?: number;
    order?: number;
  }): Promise<StructureItemEntity> {
    let parent: StructureItemEntity | null = null;
    if (dto.parentId) {
      parent = await this.structureRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent with ID ${dto.parentId} not found`);
      }
    }

    let page: PageEntity | null = null;
    if (dto.pageId) {
      page = await this.pageRepository.findOne({ where: { id: dto.pageId } });
      if (!page) {
        throw new NotFoundException(`Page with ID ${dto.pageId} not found`);
      }
    }

    const item = this.structureRepository.create({
      name: dto.name,
      description: dto.description,
      parent,
      page,
      order: dto.order || 0,
    });

    return this.structureRepository.save(item);
  }

  async findAllStructureItems(): Promise<StructureItemEntity[]> {
    return this.structureRepository.find({
      relations: ['parent', 'page'],
      order: { order: 'ASC' },
    });
  }

  async updateStructureItem(
    id: number,
    dto: Partial<{
      name: string;
      description: string;
      parentId: number;
      pageId: number;
      order: number;
    }>,
  ): Promise<StructureItemEntity> {
    const item = await this.structureRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Structure item with ID ${id} not found`);
    }

    if (dto.parentId !== undefined) {
      item.parent = dto.parentId
        ? await this.structureRepository.findOne({ where: { id: dto.parentId } })
        : null;
    }

    if (dto.pageId !== undefined) {
      item.page = dto.pageId
        ? await this.pageRepository.findOne({ where: { id: dto.pageId } })
        : null;
    }

    Object.assign(item, {
      name: dto.name ?? item.name,
      description: dto.description ?? item.description,
      order: dto.order ?? item.order,
    });

    return this.structureRepository.save(item);
  }

  async deleteStructureItem(id: number): Promise<void> {
    const item = await this.structureRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Structure item with ID ${id} not found`);
    }
    await this.structureRepository.remove(item);
  }
}

