import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NewsEntity } from './entities/news.entity';
import { NewsCategory } from './entities/news-category.entity';
import { CreateNewsDto } from './dto/create-news.dto';
import { FilesService } from '../files/files.service';
import { Files } from '../files/files.entity';
import { SocialExportService } from '../social-export/social-export.service';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(NewsCategory)
    private readonly categoryRepository: Repository<NewsCategory>,
    private readonly filesService: FilesService,
    @Optional()
    private readonly socialExportService?: SocialExportService,
  ) {}

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async create(dto: CreateNewsDto): Promise<NewsEntity> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
    }

    const slug = dto.slug || this.generateSlug(dto.title);

    const existingNews = await this.newsRepository.findOne({
      where: { slug },
    });
    if (existingNews) {
      throw new NotFoundException(`News with slug "${slug}" already exists`);
    }

    let publishedAt: Date | null = null;
    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    } else {
      publishedAt = new Date(); // По умолчанию текущая дата
    }

    let coverImage: Files | null = null;
    if (dto.coverImageId) {
      try {
        coverImage = await this.filesService.findOne(dto.coverImageId);
      } catch (error) {
        throw new NotFoundException(`Cover image with ID ${dto.coverImageId} not found`);
      }
    }

    let gallery: Files[] = [];
    if (dto.galleryIds?.length) {
      gallery = await this.filesService.findMany(dto.galleryIds);
      if (gallery.length !== dto.galleryIds.length) {
        throw new NotFoundException('Some gallery files not found');
      }
    }

    const news = this.newsRepository.create({
      title: dto.title,
      slug,
      shortDescription: dto.shortDescription,
      content: dto.content,
      category,
      publishedAt,
      coverImage,
      gallery,
      isPublished: dto.isPublished ?? false,
    });

    const savedNews = await this.newsRepository.save(news);

    // Автоматический экспорт в соцсети, если новость опубликована и включен экспорт
    if (savedNews.isPublished && this.socialExportService) {
      const autoExport = process.env.AUTO_EXPORT_NEWS === 'true';
      if (autoExport) {
        // Экспортируем асинхронно, не блокируя ответ
        this.socialExportService.exportToAll(savedNews.id).catch((error) => {
          console.error('Failed to auto-export news to social networks:', error);
        });
      }
    }

    return this.findOne(savedNews.id);
  }

  async findAll(filters?: {
    categoryId?: number;
    year?: number;
  }) {
    const queryBuilder = this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.category', 'category')
      .leftJoinAndSelect('news.coverImage', 'coverImage')
      .leftJoinAndSelect('news.gallery', 'gallery');

    if (filters?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters?.year) {
      queryBuilder.andWhere('EXTRACT(YEAR FROM news.publishedAt) = :year', { year: filters.year });
    }

    queryBuilder.orderBy('news.publishedAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<NewsEntity> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['category', 'coverImage', 'gallery'],
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    news.viewsCount += 1;
    await this.newsRepository.save(news);

    return news;
  }

  async delete(id: number): Promise<void> {
    const news = await this.findOne(id);

    if (news.coverImage?.id) {
      await this.filesService.delete(news.coverImage.id);
    }
    
    if (news.gallery?.length) {
      for (const file of news.gallery) {
        await this.filesService.delete(file.id);
      }
    }

    await this.newsRepository.remove(news);
  }

  async updateCoverImage(id: number, coverImage: Files): Promise<NewsEntity> {
    const news = await this.findOne(id);
    news.coverImage = coverImage;
    const savedNews = await this.newsRepository.save(news);
    return this.findOne(savedNews.id);
  }

  async addToGallery(id: number, files: Files[]): Promise<NewsEntity> {
    console.log('addToGallery called with files:', files.map(f => ({ id: f.id, filename: f.filename_disk })));
    
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['category', 'coverImage', 'gallery'],
    });

    if (!news) {
      throw new NotFoundException(`News with ID ${id} not found`);
    }

    console.log('Current gallery before update:', news.gallery?.map(f => f.id) || []);
    
    // Проверяем, что все файлы сохранены в БД
    const existingFiles = await this.filesService.findMany(files.map(f => f.id));
    console.log('Existing files in DB:', existingFiles.map(f => f.id));
    
    if (existingFiles.length !== files.length) {
      throw new NotFoundException('Some files were not saved to database');
    }

    // Объединяем существующую галерею с новыми файлами
    const currentGalleryIds = (news.gallery || []).map(f => f.id);
    const newFilesIds = files.map(f => f.id);
    const allFileIds = [...new Set([...currentGalleryIds, ...newFilesIds])];
    
    const allFiles = await this.filesService.findMany(allFileIds);
    
    news.gallery = allFiles;
    const savedNews = await this.newsRepository.save(news);
    
    const updatedNews = await this.newsRepository.findOne({
      where: { id: savedNews.id },
      relations: ['category', 'coverImage', 'gallery'],
    });

    if (!updatedNews) {
      throw new NotFoundException(`News with ID ${savedNews.id} not found`);
    }

    console.log('Gallery after save:', updatedNews.gallery?.map(f => f.id) || []);
    
    return updatedNews;
  }

  // CRUD для категорий новостей
  async getAllCategories(): Promise<NewsCategory[]> {
    return this.categoryRepository.find();
  }

  async createCategory(name: string): Promise<NewsCategory> {
    const category = this.categoryRepository.create({ name });
    return this.categoryRepository.save(category);
  }
}
