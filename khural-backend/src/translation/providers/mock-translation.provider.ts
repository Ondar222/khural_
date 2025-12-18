import { Injectable } from '@nestjs/common';
import { ITranslationProvider } from '../interfaces/translation-provider.interface';
import { Locale } from '../../common/interfaces/localizable.interface';

@Injectable()
export class MockTranslationProvider implements ITranslationProvider {
  /**
   * Заглушка: возвращает исходный текст
   * В будущем здесь будет интеграция с реальным ИИ-решением
   */
  async translate(text: string, from: Locale, to: Locale): Promise<string> {
    if (from === to) {
      return text;
    }

    // Заглушка: просто возвращаем исходный текст
    // TODO: Интегрировать с ИИ-решением заказчика для перевода на тувинский
    console.log(`[MockTranslation] Translating from ${from} to ${to}: ${text.substring(0, 50)}...`);
    
    return text;
  }

  async translateBatch(
    texts: string[],
    from: Locale,
    to: Locale,
  ): Promise<string[]> {
    return Promise.all(texts.map((text) => this.translate(text, from, to)));
  }

  isSupported(from: Locale, to: Locale): boolean {
    // Поддерживаем все комбинации (заглушка)
    return true;
  }
}

