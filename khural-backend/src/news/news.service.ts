import { Injectable, NotFoundException } from '@nestjs/common';
import { NewsEntity } from './entities/news.entity';
import { CreateNewsDto, CreatePersonFilesDto} from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsRepository } from './news.repository';
import { Files } from '../files/files.entity';
import { last } from 'rxjs';
import * as string_decoder from 'node:string_decoder';
import { FilesRepository } from '../files/files.repository';
import { FilesService } from '../files/files.service';

@Injectable()
export class NewsService {
  constructor(private readonly newsRepository: NewsRepository,
              private readonly filesRepository: FilesRepository,
              private readonly fileService: FilesService,) {}

  async createNews(dto: CreateNewsDto) {
    try {
      const news = this.newsRepository.create({
        content: dto.content,
        category: dto.category,
        publishedAt: dto.publishedAt,
        externalId: dto.externalId,
      });
      return await this.newsRepository.save(news);
    } catch (error) {
      console.error('Не создалось', error);
      throw error;
    }
  }

  async update(id: number, dto: UpdateNewsDto) {
    const news = await this.newsRepository.findOne({ where: { id } });
    if (!news) throw new NotFoundException(`Новость с ID ${id} не найдена`);
    Object.assign(news, dto);
    return await this.newsRepository.save(news);
  }

  async setMediaById(
    news: NewsEntity | null,
    { images }: { images?: Files[] },
  ) {
    const updateResultCount: { images: number } = {
      images: 0,
    };
    if (!news) {
      throw new NotFoundException('Новость не найдена');
    }
    if (images && images.length > 0) {
      const imageUploadResult = await this.newsRepository
          .createQueryBuilder("news")
          .relation(NewsEntity, "images")
          .of(news)
          .add(images);

        updateResultCount.images = images.length;
    }
    return updateResultCount;
  }

  async findAll() {
    const content =  this.newsRepository.find({
      relations: {
        content: true,
        images: true,
      },
    });

    return await content;
  }

  async findOne(id: number): Promise<NewsEntity | null> {
    return await this.newsRepository.findOne({
      where: { id },
    });
  }

  async delete(id: number) {
    return await this.newsRepository.delete(id);
  }
}
