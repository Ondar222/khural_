import { useState, useCallback, useEffect, useRef } from "react";
import { PublicApi } from "../api/client.js";

/**
 * Типы языков для перевода
 * @typedef {'ru' | 'ty' | 'tyv'} Locale
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
 * Ключ кэша переводов: язык_на_язык::текст
 * @param {string} from - Исходный язык
 * @param {string} to - Целевой язык
 * @param {string} text - Текст
 * @returns {string}
 */
function translationCacheKey(from, to, text) {
  return `${from}->${to}::${text}`;
}

// Модульный кэш переводов (общий для всех экземпляров хука на клиенте)
const translationCache = new Map();

// Single-flight: одинаковый запрос не отправляется дважды одновременно
const inflightRequests = new Map();

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
 * @property {function(Object): Promise<{id?: string|number, title: string, excerpt: string, contentHtml: string}>} translateNews - Функция перевода новости (API-новость или сущность с полями ...Ty)
 * @property {function(Object[], Object): Promise<Array>} translateNewsList - Перевод списка новостей одним батчем
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
 * 
 * @example
 * // Перевод новости из API (без заполненных ...Ty полей — переводит автоматически)
 * const { translateNews, translateNewsList } = useTranslation();
 * const news = await translateNews({ id: 5, title: 'О Верховном Хурале', excerpt: '...' });
 * // => { id: 5, title: <тувинский перевод>, excerpt: <тувинский перевод> }
 */
export function useTranslation(options = {}) {
  const { defaultFrom = "ru", defaultTo = "tyv" } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const activeRequestsRef = useRef(0);

  const extractTranslatedText = useCallback((result) => {
    if (!result) return "";
    if (typeof result === "string") return result;
    // API возвращает { original, translated, from, to }
    return result?.translated || "";
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Однократный перевод текста (запрос к API/Google Translate)
   */
  const translateOnce = useCallback(
    async (text, from, to) => {
      if (!text || typeof text !== "string" || text.trim() === "") {
        return {
          original: text || "",
          translated: text || "",
          from,
          to,
        };
      }

      activeRequestsRef.current += 1;
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
          const translationResults = new Array(textSegmentsToTranslate.length);
          let nextSegment = 0;
          const translateSegmentWorker = async () => {
            while (nextSegment < textSegmentsToTranslate.length) {
              const index = nextSegment++;
              translationResults[index] = await PublicApi.translate(
                textSegmentsToTranslate[index].content,
                from,
                to
              );
            }
          };
          await Promise.all(
            Array.from(
              { length: Math.min(4, textSegmentsToTranslate.length) },
              () => translateSegmentWorker()
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
        activeRequestsRef.current -= 1;
        setLoading(activeRequestsRef.current > 0);
      }
    },
    [extractTranslatedText]
  );

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

      const cacheKeyStr = translationCacheKey(from, to, text);
      const cachedTranslation = translationCache.get(cacheKeyStr);
      if (cachedTranslation) {
        return { original: text, translated: cachedTranslation, from, to };
      }

      // Single-flight: пока запрос в полёте — ждём его результат
      if (!inflightRequests.has(cacheKeyStr)) {
        inflightRequests.set(
          cacheKeyStr,
          translateOnce(text, from, to).finally(() => inflightRequests.delete(cacheKeyStr))
        );
      }
      const result = await inflightRequests.get(cacheKeyStr);
      translationCache.set(cacheKeyStr, result.translated);
      return result;
    },
    [defaultFrom, defaultTo, translateOnce]
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

      setError(null);
      const missing = [];
      const missingIndices = new Map();
      const results = texts.map((text, index) => {
        const original = typeof text === "string" ? text : String(text ?? "");
        const cacheKeyStr = translationCacheKey(from, to, original);
        const cached = translationCache.get(cacheKeyStr);
        if (cached) return { original, translated: cached, from, to };
        if (original.trim()) {
          if (!missingIndices.has(cacheKeyStr)) {
            missingIndices.set(cacheKeyStr, []);
            missing.push(original);
          }
          missingIndices.get(cacheKeyStr).push(index);
        }
        return { original, translated: original, from, to };
      });

      if (missing.length === 0) return results;

      const batchResult = await PublicApi.translateBatch(missing, from, to);
      (batchResult.translated || missing).forEach((translated, missingIndex) => {
        const original = missing[missingIndex];
        const normalizedTranslation =
          typeof translated === "string" && translated.trim() ? translated : original;
        const cacheKeyStr = translationCacheKey(from, to, original);
        if (normalizedTranslation !== original) {
          translationCache.set(cacheKeyStr, normalizedTranslation);
        }
        (missingIndices.get(cacheKeyStr) || []).forEach((resultIndex) => {
          results[resultIndex] = {
            original: results[resultIndex].original,
            translated: normalizedTranslation,
            from,
            to,
          };
        });
      });
      return results;
    },
    [defaultFrom, defaultTo]
  );

  /**
   * Переводит новость (любую сущность с полями title/excerpt/content и ...Ty) в целевую локаль.
   * Если для целевого языка уже есть сохранённый перевод (...Ty) — используется он,
   * иначе текст переводится через Translator (backend → Google Translate fallback).
   * 
   * @param {Object} newsItem - Новость: { id, title, excerpt, contentHtml, titleTy, excerptTy, contentHtmlTy }
   * @param {Object} [options] - Опции перевода
   * @param {Locale} [options.from='ru'] - Исходный язык
   * @param {Locale} [options.to='tyv'] - Целевой язык
   * @returns {Promise<{id?: string|number, title: string, excerpt: string, contentHtml: string}>} Локализованные поля новости
   */
  const translateNews = useCallback(
    async (newsItem, { from = defaultFrom, to = defaultTo } = {}) => {
      const getStr = (v) => String(v ?? "").trim();
      const titleSource = getStr(newsItem?.title ?? newsItem?.name ?? newsItem?.headline);
      const excerptSource = getStr(
        newsItem?.excerpt ?? newsItem?.description ?? newsItem?.shortDescription ?? newsItem?.subtitle ?? newsItem?.desc
      );
      const contentSource = getStr(
        newsItem?.contentHtml ?? newsItem?.content ?? newsItem?.contentText ?? newsItem?.content_html
      );
      const titleTy = getStr(newsItem?.titleTy ?? newsItem?.title_ty);
      const excerptTy = getStr(newsItem?.excerptTy ?? newsItem?.descTy ?? newsItem?.descriptionTy ?? newsItem?.shortDescriptionTy);
      const contentHtmlTy = getStr(newsItem?.contentHtmlTy ?? newsItem?.content_ty ?? newsItem?.contentDescriptionTy);

      const title = titleTy || (await translate(titleSource, from, to)).translated;
      const excerpt = excerptTy || (await translate(excerptSource, from, to)).translated;
      const contentHtml = contentHtmlTy || (await translate(contentSource, from, to)).translated;

      return { id: newsItem?.id, title, excerpt, contentHtml };
    },
    [translate, defaultFrom, defaultTo]
  );

  /**
   * Переводит список новостей одним батчем запросов.
   * Новости с уже заполненными ...Ty полями не переводятся — используются сохранённые значения.
   * 
   * @param {Object[]} newsItems - Массив новостей: [{ id, title, excerpt, contentHtml, titleTy, excerptTy, contentHtmlTy }]
   * @param {Object} [options] - Опции перевода
   * @param {Locale} [options.from='ru'] - Исходный язык
   * @param {Locale} [options.to='tyv'] - Целевой язык
   * @returns {Promise<Array<{id?: string|number, title: string, excerpt: string, contentHtml: string}>>} Массив локализованных новостей (порядок совпадает с входом)
   */
  const translateNewsList = useCallback(
    async (newsItems, { from = defaultFrom, to = defaultTo } = {}) => {
      const list = Array.isArray(newsItems) ? newsItems : [];
      const prepared = list.map((item) => {
        const getStr = (v) => String(v ?? "").trim();
        const titleSource = getStr(item?.title ?? item?.name ?? item?.headline);
        const excerptSource = getStr(
          item?.excerpt ?? item?.description ?? item?.shortDescription ?? item?.subtitle ?? item?.desc
        );
        const contentSource = getStr(
          item?.contentHtml ?? item?.content ?? item?.contentText ?? item?.content_html
        );
        const titleTy = getStr(item?.titleTy ?? item?.title_ty);
        const excerptTy = getStr(item?.excerptTy ?? item?.descTy ?? item?.descriptionTy ?? item?.shortDescriptionTy);
        const contentHtmlTy = getStr(item?.contentHtmlTy ?? item?.content_ty ?? item?.contentDescriptionTy);

        return {
          id: item?.id,
          titleSource,
          excerptSource,
          contentSource,
          titleTy,
          excerptTy,
          contentHtmlTy,
        };
      });
      const pending = [];
      prepared.forEach((item, index) => {
        if (!item.titleTy && item.titleSource) pending.push({ index, key: "title", text: item.titleSource });
        if (!item.excerptTy && item.excerptSource) pending.push({ index, key: "excerpt", text: item.excerptSource });
        if (!item.contentHtmlTy && item.contentSource) pending.push({ index, key: "contentHtml", text: item.contentSource });
      });
      const translations = await translateBatch(pending.map((item) => item.text), from, to);
      const translatedByField = new Map();
      pending.forEach((item, index) => {
        translatedByField.set(`${item.index}:${item.key}`, translations[index]?.translated || item.text);
      });
      return prepared.map((item, index) => ({
        id: item.id,
        title: item.titleTy || translatedByField.get(`${index}:title`) || item.titleSource,
        excerpt: item.excerptTy || translatedByField.get(`${index}:excerpt`) || item.excerptSource,
        contentHtml:
          item.contentHtmlTy ||
          translatedByField.get(`${index}:contentHtml`) ||
          item.contentSource,
      }));
    },
    [translateBatch, defaultFrom, defaultTo]
  );

  return {
    loading,
    error,
    translate,
    translateBatch,
    translateNews,
    translateNewsList,
    clearError,
  };
}

export function useAutomaticTranslation(sourceText, enabled) {
  const { translate } = useTranslation();
  const [translatedText, setTranslatedText] = useState("");

  useEffect(() => {
    if (!enabled || !sourceText) {
      setTranslatedText("");
      return undefined;
    }

    let active = true;
    setTranslatedText("");
    translate(sourceText, "ru", "tyv")
      .then((result) => {
        if (active) setTranslatedText(result?.translated || "");
      })
      .catch(() => {
        if (active) setTranslatedText("");
      });

    return () => {
      active = false;
    };
  }, [enabled, sourceText, translate]);

  return translatedText || sourceText || "";
}
