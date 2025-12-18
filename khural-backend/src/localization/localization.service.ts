import { Injectable } from '@nestjs/common';
import { Locale, ILocalizedContent } from '../common/interfaces/localizable.interface';

@Injectable()
export class LocalizationService {
  /**
   * Получить локализованный контент для указанной локали
   */
  getLocalizedContent<T extends ILocalizedContent>(
    contents: T[],
    locale: Locale,
    fallbackLocale: Locale = Locale.RU,
  ): T | null {
    if (!contents || contents.length === 0) {
      return null;
    }

    // Ищем контент для запрошенной локали
    let content = contents.find((c) => c.locale === locale);

    // Если не найден, используем fallback
    if (!content && locale !== fallbackLocale) {
      content = contents.find((c) => c.locale === fallbackLocale);
    }

    // Если все еще не найден, берем первый доступный
    if (!content) {
      content = contents[0];
    }

    return content || null;
  }

  /**
   * Получить все локализованные версии контента
   */
  getAllLocalizedContents<T extends ILocalizedContent>(contents: T[]): Record<Locale, T | null> {
    const result: Record<Locale, T | null> = {
      [Locale.RU]: null,
      [Locale.TYV]: null,
    };

    contents.forEach((content) => {
      if (content.locale in result) {
        result[content.locale as Locale] = content;
      }
    });

    return result;
  }

  /**
   * Проверить, есть ли контент для указанной локали
   */
  hasLocale<T extends ILocalizedContent>(contents: T[], locale: Locale): boolean {
    return contents.some((c) => c.locale === locale);
  }

  /**
   * Получить список доступных локалей для контента
   */
  getAvailableLocales<T extends ILocalizedContent>(contents: T[]): Locale[] {
    return contents.map((c) => c.locale).filter((locale, index, self) => self.indexOf(locale) === index);
  }
}

