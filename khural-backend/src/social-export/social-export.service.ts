import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../news/entities/news.entity';
import { VkProvider } from './providers/vk.provider';
import { TelegramProvider } from './providers/telegram.provider';
import {
  SocialExportLogEntity,
  SocialPlatform,
} from './entities/social-export-log.entity';

@Injectable()
export class SocialExportService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(SocialExportLogEntity)
    private readonly logRepository: Repository<SocialExportLogEntity>,
    private readonly vkProvider: VkProvider,
    private readonly telegramProvider: TelegramProvider,
  ) {}

  async exportToVk(newsId: number): Promise<SocialExportLogEntity> {
    const news = await this.newsRepository.findOne({ where: { id: newsId } });
    if (!news) {
      throw new Error(`News with ID ${newsId} not found`);
    }

    const result = await this.vkProvider.exportNews(news);

    const log = this.logRepository.create({
      news,
      platform: SocialPlatform.VK,
      success: result.success,
      error: result.error || null,
      externalId: result.postId?.toString() || null,
    });

    return this.logRepository.save(log);
  }

  async exportToTelegram(newsId: number): Promise<SocialExportLogEntity> {
    const news = await this.newsRepository.findOne({ where: { id: newsId } });
    if (!news) {
      throw new Error(`News with ID ${newsId} not found`);
    }

    const result = await this.telegramProvider.exportNews(news);

    const log = this.logRepository.create({
      news,
      platform: SocialPlatform.TELEGRAM,
      success: result.success,
      error: result.error || null,
      externalId: result.messageId?.toString() || null,
    });

    return this.logRepository.save(log);
  }

  async exportToAll(newsId: number): Promise<SocialExportLogEntity[]> {
    const results = await Promise.allSettled([
      this.exportToVk(newsId),
      this.exportToTelegram(newsId),
    ]);

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<SocialExportLogEntity>).value);
  }

  async getExportHistory(newsId: number): Promise<SocialExportLogEntity[]> {
    return this.logRepository.find({
      where: { news: { id: newsId } },
      order: { createdAt: 'DESC' },
    });
  }
}

