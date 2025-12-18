import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NewsEntity } from '../../news/entities/news.entity';

@Injectable()
export class VkProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Экспорт новости в ВКонтакте
   * Требует настройки: VK_ACCESS_TOKEN, VK_GROUP_ID
   */
  async exportNews(news: NewsEntity): Promise<{ success: boolean; postId?: number; error?: string }> {
    const accessToken = this.configService.get<string>('VK_ACCESS_TOKEN');
    const groupId = this.configService.get<string>('VK_GROUP_ID');

    if (!accessToken || !groupId) {
      return {
        success: false,
        error: 'VK credentials not configured',
      };
    }

    try {
      const message = this.formatNewsMessage(news);
      const attachments = news.coverImage?.id ? this.getImageAttachment(news.coverImage.id) : '';

      const response = await firstValueFrom(
        this.httpService.post('https://api.vk.com/method/wall.post', null, {
          params: {
            owner_id: `-${groupId}`, // Отрицательное значение для группы
            message,
            attachments,
            access_token: accessToken,
            v: '5.131',
          },
        }),
      );

      if (response.data.response) {
        return {
          success: true,
          postId: response.data.response.post_id,
        };
      } else {
        return {
          success: false,
          error: response.data.error?.error_msg || 'Unknown error',
        };
      }
    } catch (error) {
      console.error('VK export error:', error);
      const message = error instanceof Error ? error.message : 'Failed to export to VK';
      return {
        success: false,
        error: message,
      };
    }
  }

  private formatNewsMessage(news: NewsEntity): string {
    let message = `${news.title}\n\n`;
    
    if (news.shortDescription) {
      message += `${news.shortDescription}\n\n`;
    }

    // Обрезаем контент до 2000 символов (лимит ВК)
    const content = news.content.replace(/<[^>]*>/g, '').substring(0, 2000);
    message += content;

    // Добавляем ссылку на полную новость
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    if (frontendUrl) {
      message += `\n\nЧитать полностью: ${frontendUrl}/news/${news.id}`;
    }

    return message;
  }

  private getImageAttachment(imageId: string): string {
    const cdnUrl = this.configService.get<string>('CDN') || '';
    const imageUrl = `${cdnUrl}/${imageId}`;
    return imageUrl; // ВК требует загрузку изображения через их API, здесь упрощенная версия
  }
}

