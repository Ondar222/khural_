import { Locale } from '../../common/interfaces/localizable.interface';

export interface ITranslationProvider {
  /**
   * Перевести текст с одного языка на другой
   */
  translate(text: string, from: Locale, to: Locale): Promise<string>;

  /**
   * Перевести массив текстов
   */
  translateBatch(
    texts: string[],
    from: Locale,
    to: Locale,
  ): Promise<string[]>;

  /**
   * Проверить, поддерживается ли перевод между языками
   */
  isSupported(from: Locale, to: Locale): boolean;
}

