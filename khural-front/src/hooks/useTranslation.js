import { useState, useCallback } from "react";
import { PublicApi } from "../api/client.js";

/**
 * Типы языков для перевода
 * @typedef {'ru' | 'tyv'} Locale
 */

/**
 * Структура для хранения HTML-тега и его содержимого
 * @typedef {Object} HtmlSegment
 * @property {string} type - Тип сегмента: 'tag' или 'text'
 * @property {string} content - Содержимое (тег или текст)
 * @property {number} index - Индекс для восстановления порядка
 */

/**
 * Извлекает HTML-теги и текстовые сегменты из строки
 * @param {string} html - HTML строка
 * @returns {HtmlSegment[]} Массив сегментов (теги и текст)
 */
function parseHtmlSegments(html) {
  if (!html || typeof html !== "string") return [];
  
  const segments = [];
  let currentIndex = 0;
  const tagRegex = /<[^>]+>/g;
  let lastIndex = 0;
  let match;

  // Находим все HTML-теги
  while ((match = tagRegex.exec(html)) !== null) {
    const tagStart = match.index;
    const tagEnd = tagRegex.lastIndex;

    // Добавляем текст перед тегом, если он есть (включая пробелы)
    if (tagStart > lastIndex) {
      const text = html.substring(lastIndex, tagStart);
      // Сохраняем все текстовые сегменты, даже если они содержат только пробелы
      segments.push({
        type: "text",
        content: text,
        index: currentIndex++,
      });
    }

    // Добавляем сам тег
    segments.push({
      type: "tag",
      content: match[0],
      index: currentIndex++,
    });

    lastIndex = tagEnd;
  }

  // Добавляем оставшийся текст после последнего тега (включая пробелы)
  if (lastIndex < html.length) {
    const text = html.substring(lastIndex);
    // Сохраняем все текстовые сегменты, даже если они содержат только пробелы
    segments.push({
      type: "text",
      content: text,
      index: currentIndex++,
    });
  }

  // Если нет тегов, возвращаем весь текст как один сегмент
  if (segments.length === 0) {
    segments.push({
      type: "text",
      content: html,
      index: 0,
    });
  }

  return segments;
}

/**
 * Восстанавливает HTML из сегментов с переведенным текстом
 * Сохраняет пробелы и форматирование оригинального текста
 * @param {HtmlSegment[]} segments - Массив сегментов
 * @param {Map<number, string>} translatedTextsMap - Map индексов текстовых сегментов к переведенным текстам
 * @returns {string} Восстановленный HTML с переведенным текстом
 */
function reconstructHtml(segments, translatedTextsMap) {
  return segments
    .sort((a, b) => a.index - b.index)
    .map((segment) => {
      if (segment.type === "tag") {
        return segment.content;
      } else {
        // Используем переведенный текст из map или оригинальный, если перевод недоступен
        const translated = translatedTextsMap.get(segment.index);
        if (translated !== undefined) {
          const original = segment.content;
          const originalTrimmed = original.trim();
          
          // Если оригинал содержал только пробелы или перевод равен оригиналу,
          // возвращаем оригинал как есть (уже содержит все пробелы)
          if (originalTrimmed.length === 0 || translated === originalTrimmed) {
            return original;
          }
          
          // Для переведенных текстов сохраняем пробелы в начале и конце
          const leadingWhitespace = original.match(/^\s*/)?.[0] || "";
          const trailingWhitespace = original.match(/\s*$/)?.[0] || "";
          return leadingWhitespace + translated + trailingWhitespace;
        }
        return segment.content;
      }
    })
    .join("");
}

/**
 * Результат перевода одного текста
 * @typedef {Object} TranslationResult
 * @property {string} original - Исходный текст
 * @property {string} translated - Переведенный текст
 * @property {Locale} from - Исходный язык
 * @property {Locale} to - Целевой язык
 */

/**
 * Состояние хука перевода
 * @typedef {Object} UseTranslationState
 * @property {boolean} loading - Флаг загрузки
 * @property {Error|null} error - Ошибка перевода, если есть
 * @property {function(string, Locale, Locale): Promise<TranslationResult>} translate - Функция перевода одного текста
 * @property {function(string[], Locale, Locale): Promise<TranslationResult[]>} translateBatch - Функция перевода массива текстов
 * @property {function(): void} clearError - Очистить ошибку
 */

/**
 * Хук для перевода текстов через API бэкенда
 * 
 * Следует принципу Single Responsibility - занимается только переводом текстов
 * с одного языка на другой используя API бэкенда.
 * 
 * @param {Object} [options] - Опции хука
 * @param {Locale} [options.defaultFrom='ru'] - Язык по умолчанию для исходного текста
 * @param {Locale} [options.defaultTo='tyv'] - Язык по умолчанию для целевого текста
 * @returns {UseTranslationState} Состояние и функции хука
 * 
 * @example
 * // Базовое использование
 * const { translate, loading, error } = useTranslation();
 * const result = await translate('Привет', 'ru', 'tyv');
 * 
 * @example
 * // С языками по умолчанию
 * const { translate } = useTranslation({ defaultFrom: 'ru', defaultTo: 'tyv' });
 * const result = await translate('Привет'); // использует defaultFrom и defaultTo
 * 
 * @example
 * // Перевод массива текстов
 * const { translateBatch } = useTranslation();
 * const results = await translateBatch(['Текст 1', 'Текст 2'], 'ru', 'tyv');
 */
export function useTranslation(options = {}) {
  const { defaultFrom = "ru", defaultTo = "tyv" } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Извлекает переведенный текст из ответа API
   * @param {any} result - Результат от API
   * @returns {string} Переведенный текст
   */
  const extractTranslatedText = useCallback((result) => {
    if (!result) return "";
    if (typeof result === "string") return result;
    // API возвращает { original, translated, from, to }
    return result?.translated || "";
  }, []);

  /**
   * Очищает ошибку
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Переводит один текст с одного языка на другой
   * Поддерживает HTML-теги: извлекает текст, переводит его и восстанавливает структуру
   * 
   * @param {string} text - Текст для перевода (может содержать HTML-теги)
   * @param {Locale} [from] - Исходный язык (если не указан, используется defaultFrom)
   * @param {Locale} [to] - Целевой язык (если не указан, используется defaultTo)
   * @returns {Promise<TranslationResult>} Результат перевода
   * @throws {Error} Если произошла ошибка при переводе
   */
  const translate = useCallback(
    async (text, from = defaultFrom, to = defaultTo) => {
      if (!text || typeof text !== "string" || text.trim() === "") {
        return {
          original: text || "",
          translated: text || "",
          from,
          to,
        };
      }

      setLoading(true);
      setError(null);

      try {
        // Проверяем, содержит ли текст HTML-теги
        const hasHtmlTags = /<[^>]+>/.test(text);
        
        if (hasHtmlTags) {
          // Парсим HTML на сегменты (теги и текст)
          const segments = parseHtmlSegments(text);
          
          // Извлекаем только текстовые сегменты для перевода (игнорируем пустые и только пробелы)
          const textSegmentsToTranslate = segments
            .filter((s) => s.type === "text" && s.content.trim().length > 0)
            .map((s) => ({
              index: s.index,
              content: s.content.trim(),
            }));

          if (textSegmentsToTranslate.length === 0) {
            // Если нет текста для перевода, возвращаем оригинал
            return {
              original: text,
              translated: text,
              from,
              to,
            };
          }

          // Переводим все текстовые сегменты параллельно
          const translationResults = await Promise.all(
            textSegmentsToTranslate.map((textSegment) =>
              PublicApi.translate(textSegment.content, from, to)
            )
          );

          // Создаем Map для связи индексов сегментов с переведенными текстами
          const translatedTextsMap = new Map();
          textSegmentsToTranslate.forEach((textSegment, i) => {
            const translated = extractTranslatedText(translationResults[i]);
            translatedTextsMap.set(textSegment.index, translated);
          });

          // Для текстовых сегментов, которые не были переведены (пустые или только пробелы),
          // сохраняем оригинальное содержимое
          segments
            .filter((s) => s.type === "text" && !translatedTextsMap.has(s.index))
            .forEach((segment) => {
              translatedTextsMap.set(segment.index, segment.content);
            });

          // Восстанавливаем HTML структуру с переведенным текстом
          const translated = reconstructHtml(segments, translatedTextsMap);

          return {
            original: text,
            translated,
            from,
            to,
          };
        } else {
          // Обычный текст без HTML - переводим как есть
          const result = await PublicApi.translate(text, from, to);
          const translated = extractTranslatedText(result);

          return {
            original: text,
            translated,
            from,
            to,
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [defaultFrom, defaultTo, extractTranslatedText]
  );

  /**
   * Переводит массив текстов с одного языка на другой
   * 
   * @param {string[]} texts - Массив текстов для перевода
   * @param {Locale} [from] - Исходный язык (если не указан, используется defaultFrom)
   * @param {Locale} [to] - Целевой язык (если не указан, используется defaultTo)
   * @returns {Promise<TranslationResult[]>} Массив результатов перевода
   * @throws {Error} Если произошла ошибка при переводе
   */
  const translateBatch = useCallback(
    async (texts, from = defaultFrom, to = defaultTo) => {
      if (!Array.isArray(texts) || texts.length === 0) {
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        // Переводим все тексты параллельно для лучшей производительности
        const results = await Promise.all(
          texts.map((text) =>
            text && typeof text === "string" && text.trim() !== ""
              ? PublicApi.translate(text, from, to)
              : Promise.resolve({ original: text || "", translated: text || "", from, to })
          )
        );

        return results.map((result) => ({
          original: result?.original || "",
          translated: extractTranslatedText(result),
          from,
          to,
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [defaultFrom, defaultTo, extractTranslatedText]
  );

  return {
    loading,
    error,
    translate,
    translateBatch,
    clearError,
  };
}

