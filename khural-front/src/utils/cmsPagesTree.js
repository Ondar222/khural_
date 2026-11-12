import { AboutApi } from "../api/client.js";

/**
 * Общий кэш дерева CMS-страниц.
 *
 * Header и SideNav запрашивают одно и то же дерево. Раньше каждый компонент
 * делал свой запрос при каждом монтировании, поэтому при переходе между
 * страницами боковое меню сначала рисовалось без CMS-страниц, а через
 * мгновение «дорисовывало» их — из-за этого меню смещалось.
 *
 * Теперь дерево загружается один раз и переиспользуется всеми компонентами:
 * при следующей навигации ссылки доступны сразу, ещё до ответа сервера.
 */

const CACHE_TTL_MS = 30 * 1000;

let cache = null;
let cachedAt = 0;
let pending = null;

function normalizeTree(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

/** Последнее загруженное дерево (или null, если ещё не загружали). */
export function getCachedPagesTree() {
  return cache;
}

/** Сбрасывает кэш, чтобы следующая загрузка пришла с сервера. */
export function invalidatePagesTree() {
  cache = null;
  cachedAt = 0;
}

/**
 * Загружает дерево страниц. Параллельные вызовы объединяются в один запрос.
 * Если кэш ещё актуален, возвращает его без запроса.
 */
export function fetchPagesTree({ force = false } = {}) {
  const isFresh = cache !== null && Date.now() - cachedAt < CACHE_TTL_MS;
  if (!force && isFresh) return Promise.resolve(cache);
  if (pending) return pending;

  pending = AboutApi.listPagesTree({ publishedOnly: true })
    .then((res) => {
      cache = normalizeTree(res);
      cachedAt = Date.now();
      return cache;
    })
    .catch(() => {
      // При временной ошибке оставляем прежние данные, чтобы меню не «худело».
      return cache || [];
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

// Событие из админки после создания/изменения страницы.
if (typeof window !== "undefined") {
  window.addEventListener("khural:pages-reload", () => {
    invalidatePagesTree();
  });
}

/**
 * Сбрасывает кэш, сообщает открытым меню о перезагрузке и сразу прогревает
 * кэш новыми данными. Вызывать из админки после создания/сохранения страницы,
 * чтобы меню на публичных страницах появлялось уже с новой страницей.
 */
export function refreshPagesTree() {
  invalidatePagesTree();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("khural:pages-reload"));
  }
  return fetchPagesTree({ force: true });
}
