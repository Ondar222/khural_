import { Injectable, Inject } from '@nestjs/common';
import { ITranslationProvider } from './interfaces/translation-provider.interface';
import { Locale } from '../common/interfaces/localizable.interface';

@Injectable()
export class TranslationService {
  constructor(
    @Inject('ITranslationProvider')
    private readonly translationProvider: ITranslationProvider,
  ) {}

  /**
   * Перевести текст
   */
  async translate(text: string, from: Locale, to: Locale): Promise<string> {
    if (!this.translationProvider.isSupported(from, to)) {
      throw new Error(`Translation from ${from} to ${to} is not supported`);
    }

    return this.translationProvider.translate(text, from, to);
  }

  /**
   * Перевести массив текстов
   */
  async translateBatch(
    texts: string[],
    from: Locale,
    to: Locale,
  ): Promise<string[]> {
    if (!this.translationProvider.isSupported(from, to)) {
      throw new Error(`Translation from ${from} to ${to} is not supported`);
    }

    return this.translationProvider.translateBatch(texts, from, to);
  }

  /**
   * Перевести объект с локализованными полями
   */
  async translateObject<T extends Record<string, any>>(
    obj: T,
    from: Locale,
    to: Locale,
    fields: string[],
  ): Promise<T> {
    const translated = { ...obj } as T;

    for (const field of fields) {
      if (translated[field] && typeof translated[field] === 'string') {
        (translated as any)[field] = await this.translate(
          translated[field] as string,
          from,
          to,
        );
      }
    }

    return translated;
  }
}

