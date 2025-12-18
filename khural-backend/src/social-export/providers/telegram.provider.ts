import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { NewsEntity } from '../../news/entities/news.entity';

@Injectable()
export class TelegramProvider {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Экспорт новости в Telegram
   * Требует настройки: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
   */
  async exportNews(news: NewsEntity): Promise<{ success: boolean; messageId?: number; error?: string }> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      return {
        success: false,
        error: 'Telegram credentials not configured',
      };
    }

    try {
      const message = this.formatNewsMessage(news);
      const imageUrl = news.coverImage?.id 
        ? `${this.configService.get<string>('CDN') || ''}/${news.coverImage.id}`
        : null;

      const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const payload: any = {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      };

      // Если есть изображение, отправляем как фото с подписью
      if (imageUrl) {
        const photoUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
        const photoPayload = {
          chat_id: chatId,
          photo: imageUrl,
          caption: message.substring(0, 1024), // Лимит подписи в Telegram
          parse_mode: 'HTML',
        };

        const response = await firstValueFrom(
          this.httpService.post(photoUrl, photoPayload),
        );

        if (response.data.ok) {
          return {
            success: true,
            messageId: response.data.result.message_id,
          };
        }
      } else {
        const response = await firstValueFrom(
          this.httpService.post(apiUrl, payload),
        );

        if (response.data.ok) {
          return {
            success: true,
            messageId: response.data.result.message_id,
          };
        }
      }

      return {
        success: false,
        error: 'Failed to send message',
      };
    } catch (error) {
      console.error('Telegram export error:', error);
      const message = error instanceof Error ? error.message : 'Failed to export to Telegram';
      return {
        success: false,
        error: message,
      };
    }
  }

  private formatNewsMessage(news: NewsEntity): string {
    let message = `<b>${this.escapeHtml(news.title)}</b>\n\n`;
    
    if (news.shortDescription) {
      message += `${this.escapeHtml(news.shortDescription)}\n\n`;
    }

    // Обрезаем контент до 4000 символов (лимит Telegram)
    const content = news.content.replace(/<[^>]*>/g, '').substring(0, 4000);
    message += this.escapeHtml(content);

    // Добавляем ссылку на полную новость
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    if (frontendUrl) {
      message += `\n\n<a href="${frontendUrl}/news/${news.id}">Читать полностью</a>`;
    }

    return message;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

