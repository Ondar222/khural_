/**
 * Помощники для работы со ссылками на файлы документов.
 *
 * Почему это нужно:
 * 1) У части документов файла нет (в legacy-базе не было вложения) — кнопки должны
 *    оставаться на месте и объяснять, что скачать нечего.
 * 2) Часть ссылок ведёт не на файл, а на страницу сайта (например /docs/bills/name.pdf
 *    отсутствует, и сервер отдаёт SPA index.html со статусом 200). В результате в
 *    предпросмотре открывается сам сайт, а «Скачать» сохраняет HTML-страницу.
 * 3) Браузер умеет показывать только часть форматов. Для doc/docx/xls/tiff он всегда
 *    предлагает скачать файл — такие ссылки отправляем во внешний просмотрщик.
 */

const DOC_EXT =
  "pdf|doc|docx|xls|xlsx|ppt|pptx|odt|ods|rtf|txt|zip|rar|7z|jpg|jpeg|png|gif|webp|tif|tiff";

/** Расширение файла в конце пути (учитываем ?query и #hash). */
const DOC_EXT_RE = new RegExp(`\\.(${DOC_EXT})(?=([?#]|$))`, "i");

/** Файлы бэкенда отдаются без расширения: /api/files/<uuid>. */
const BACKEND_FILE_RE =
  /(?:^|\/)(?:api\/)?files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** Форматы, которые браузер показывает сам (без скачивания). */
const INLINE_EXT_RE = /\.(pdf|jpe?g|png|gif|webp|svg|txt)(?=([?#]|$))/i;

const HTML_EXT_RE = /\.html?(?=([?#]|$))/i;

/** Ссылка на файл бэкенда без расширения в пути — тип известен только из ответа сервера. */
const BACKEND_FILE_NO_EXT_RE =
  /(?:^|\/)(?:api\/)?files\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?=([?#]|$))/i;

/** Это реально ссылка на файл документа, а не на страницу сайта? */
export function isDocumentFileUrl(url) {
  const s = String(url || "").trim();
  if (!s) return false;
  if (/^(data|blob):/i.test(s)) return true;
  if (BACKEND_FILE_RE.test(s)) return true;
  if (HTML_EXT_RE.test(s)) return false;
  return DOC_EXT_RE.test(s);
}

/** Покажет ли браузер этот файл сам (PDF/картинка) — иначе нужен внешний просмотрщик. */
export function canOpenInline(url) {
  const s = String(url || "").trim();
  if (!s) return false;
  if (/^(data|blob):/i.test(s)) return true;
  // Для файлов бэкенда тип неизвестен до загрузки — считаем просматриваемым (обычно это PDF).
  if (BACKEND_FILE_NO_EXT_RE.test(s)) return true;
  return INLINE_EXT_RE.test(s);
}

/** Расширение файла по ссылке (без точки). Для /files/<uuid> неизвестно — пустая строка. */
export function getFileExt(url) {
  const m = String(url || "").match(/\.([a-z0-9]{1,5})(?=([?#]|$))/i);
  return m ? m[1].toLowerCase() : "";
}

function safeFileName(title, ext) {
  const base = String(title || "document")
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
    .trim();
  return `${base || "document"}.${ext || "pdf"}`;
}

/** Имя скачиваемого файла: файлы бэкенда отдаются uuid без расширения — подписываем сами. */
export function downloadName(title, url) {
  const ext = getFileExt(url) || "pdf";
  return safeFileName(title, ext);
}

function toAbsolute(url) {
  try {
    return new URL(String(url), typeof window !== "undefined" ? window.location.origin : "https://khural.yurta.site").toString();
  } catch {
    return String(url || "");
  }
}

/**
 * Ссылка на внешний просмотрщик (Google Docs Viewer) в полный экран.
 * Нужна, чтобы «Открыть в новой вкладке» показывало документ, а не скачивало doc/xls/tiff.
 */
export function externalViewerUrl(url) {
  const abs = toAbsolute(url);
  return `https://docs.google.com/viewer?url=${encodeURIComponent(abs)}&embedded=false`;
}

/** Внешний просмотрщик внутри iframe (требует embedded=true). */
export function embeddedViewerUrl(url) {
  const abs = toAbsolute(url);
  return `https://docs.google.com/viewer?url=${encodeURIComponent(abs)}&embedded=true`;
}

/** Первые байты ответа: страницы вместо файлов приходят как HTML — ловим по сигнатуре. */
export function looksLikeHtmlDocument(text) {
  const head = String(text || "")
    .slice(0, 1024)
    .toLowerCase();
  return (
    head.includes("<!doctype html") ||
    /<html[\s>]/.test(head) ||
    /<head[\s>]/.test(head) ||
    /<meta[^>]+charset/.test(head)
  );
}

async function readHead(blob, size = 1024) {
  try {
    const slice = blob.slice(0, size);
    return await slice.text();
  } catch {
    return "";
  }
}

/** Сервер отдал страницу сайта (index.html) вместо файла документа. */
export async function isHtmlBlob(blob) {
  if (!blob) return false;
  if (String(blob.type || "").toLowerCase().includes("text/html")) return true;
  return looksLikeHtmlDocument(await readHead(blob));
}

/** PDF определяем по сигнатуре %PDF, а не по content-type: бэкенд отдаёт и octet-stream. */
export async function isPdfBlob(blob) {
  if (!blob) return false;
  const head = await readHead(blob, 1024);
  if (head.startsWith("%PDF")) return true;
  // Не PDF, если это картинка/архив/OLE-документ (doc, xls).
  return false;
}

export const DOC_FILE_MISSING_HINT = "Файл документа не загружен на сервер";
