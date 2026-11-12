export function getPreferredLocaleToken(lang) {
  // I18nContext uses "ty" for UI language, backend uses "tyv"
  return String(lang || "").toLowerCase() === "ty" ? "tyv" : "ru";
}

export function pickLocalizedContent(page, locale) {
  if (!page) return null;
  const want = String(locale || "").toLowerCase();
  const c = page?.content;
  if (Array.isArray(c)) {
    if (want) {
      const match = c.find((x) => String(x?.locale || "").toLowerCase() === want);
      if (match) return match;
    }
    return c[0] || null;
  }
  return null;
}

export function extractPageTitle(page, locale, fallback = "") {
  const lc = pickLocalizedContent(page, locale);
  return String(lc?.title || page?.title || page?.name || fallback || "").trim();
}

import { normalizeFilesUrl } from "./filesUrl.js";

/** Экранирование значения для вставки в HTML-атрибут/текст. */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** fileId изображения из блока (поддерживаем разные формы, встречающиеся в API). */
function getBlockFileId(block) {
  const raw = block?.fileId ?? block?.file?.id ?? block?.imageId ?? block?.image?.id ?? "";
  return String(raw ?? "").trim();
}

/** URL изображения блока: сначала пробуем прямую ссылку, затем fileId. */
function getBlockImageSrc(block) {
  const direct = String(
    block?.url ?? block?.href ?? block?.src ?? block?.file?.link ?? block?.link ?? ""
  ).trim();
  if (direct) return normalizeFilesUrl(direct);
  const fileId = getBlockFileId(block);
  return fileId ? normalizeFilesUrl(`/files/v2/${fileId}`) : "";
}

/** Преобразует блоки контента (из админки) в HTML для отображения на странице. */
export function blocksToHtml(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";
  const sorted = [...blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const parts = sorted.map((b) => {
    const type = String(b?.type || "text").toLowerCase();
    const content = String(b?.content ?? "").trim();
    const caption = String(b?.caption ?? "").trim();
    if (type === "text") return content ? `<div class="page-block page-block--text">${content}</div>` : "";
    if (type === "link") {
      const href = String(b?.url ?? b?.href ?? b?.content ?? "#").trim();
      const label = caption || content || href;
      return `<div class="page-block page-block--link"><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></div>`;
    }
    if (type === "image") {
      const src = getBlockImageSrc(b);
      if (!src) return "";
      const alt = String(b?.alt ?? "").trim();
      const figCaption = caption
        ? `\n<figcaption style="font-size:13px;opacity:.75;margin-top:6px">${escapeHtml(caption)}</figcaption>`
        : "";
      return `<figure class="page-block page-block--image" style="margin:16px 0">\n<img src="${escapeHtml(
        src
      )}" alt="${escapeHtml(alt)}" loading="lazy" style="max-width:100%;height:auto;border-radius:8px;display:block" />${figCaption}\n</figure>`;
    }
    if (type === "gallery") {
      const rawIds = Array.isArray(b?.fileIds)
        ? b.fileIds
        : Array.isArray(b?.fileId)
          ? b.fileId
          : [];
      const images = rawIds
        .map((item) => {
          if (item && typeof item === "object") {
            return getBlockImageSrc(item);
          }
          const fileId = String(item ?? "").trim();
          return fileId ? normalizeFilesUrl(`/files/v2/${fileId}`) : "";
        })
        .filter(Boolean);
      if (images.length === 0) return "";
      const imgs = images
        .map(
          (src) =>
            `<img src="${escapeHtml(
              src
            )}" alt="" loading="lazy" style="max-width:100%;height:auto;border-radius:8px" />`
        )
        .join("\n");
      const figCaption = caption
        ? `\n<figcaption style="font-size:13px;opacity:.75;margin-top:6px">${escapeHtml(caption)}</figcaption>`
        : "";
      return `<figure class="page-block page-block--gallery" style="margin:16px 0;display:grid;gap:10px">\n${imgs}${figCaption}\n</figure>`;
    }
    if (type === "file") {
      const fileId = getBlockFileId(b);
      const link = normalizeFilesUrl(
        String(b?.file?.link ?? b?.link ?? "").trim() || (fileId ? `/files/v2/${fileId}` : "")
      );
      const label = caption || content || "Документ";
      return link
        ? `<div class="page-block page-block--file"><a href="${escapeHtml(link)}">${escapeHtml(label)}</a></div>`
        : "";
    }
    if (type === "quote") {
      if (!content) return "";
      return `<blockquote class="page-block page-block--quote">${content}${
        caption ? `<cite> — ${escapeHtml(caption)}</cite>` : ""
      }</blockquote>`;
    }
    return content ? `<div class="page-block">${content}</div>` : "";
  });
  return parts.filter(Boolean).join("\n");
}

/** Минимальная длина контента, чтобы считать его «непустым» (иначе показываем другую локаль). */
const MIN_CONTENT_LENGTH = 80;

/**
 * Если у страницы заполнен HTML-контент и есть блоки изображений/файлов,
 * добавляем такие блоки после контента. Текстовые блоки не дублируем —
 * они обычно и составляют content.
 */
function appendNonTextBlocks(html, blocks) {
  const extra = blocksToHtml(
    (Array.isArray(blocks) ? blocks : []).filter(
      (block) => String(block?.type || "text").toLowerCase() !== "text"
    )
  );
  if (!extra) return html;
  return html ? `${html}\n${extra}` : extra;
}

function isNonTextBlock(block) {
  return String(block?.type || "text").toLowerCase() !== "text";
}

/**
 * Блоки для отображения локали. В админке блоки изображений/файлов хранятся
 * в русской записи, даже когда у страницы есть перевод текста. Поэтому если
 * у выбранной локали нет своих нетекстовых блоков, берём их из русской.
 */
function pickNonTextBlocks(localizedEntry, content) {
  const own = Array.isArray(localizedEntry?.blocks)
    ? localizedEntry.blocks.filter(isNonTextBlock)
    : [];
  if (own.length > 0) return own;
  const ruEntry = (Array.isArray(content) ? content : []).find(
    (item) => String(item?.locale || "").toLowerCase() === "ru"
  );
  return Array.isArray(ruEntry?.blocks) ? ruEntry.blocks.filter(isNonTextBlock) : [];
}

export function extractPageHtml(page, locale) {
  if (!page) return "";
  const c = page?.content;
  if (Array.isArray(c)) {
    const lc = pickLocalizedContent(page, locale);
    let html = String(lc?.content || "").trim();
    let fromBlocks = blocksToHtml(lc?.blocks);
    if (html.length >= MIN_CONTENT_LENGTH) {
      return appendNonTextBlocks(html, pickNonTextBlocks(lc, c));
    }
    if (fromBlocks && fromBlocks.length >= MIN_CONTENT_LENGTH) return fromBlocks;
    // Выбранная локаль пустая или почти пустая — показываем любую с контентом (приоритет ru)
    const withContent = c.filter(
      (x) =>
        String(x?.content ?? "").trim().length >= MIN_CONTENT_LENGTH ||
        (Array.isArray(x?.blocks) && x.blocks.length > 0)
    );
    const fallback = withContent.find((x) => String(x?.locale || "").toLowerCase() === "ru") || withContent[0];
    if (fallback) {
      const h = String(fallback?.content || "").trim();
      if (h.length >= MIN_CONTENT_LENGTH) return appendNonTextBlocks(h, fallback?.blocks);
      const fbBlocks = blocksToHtml(fallback?.blocks);
      if (fbBlocks) return fbBlocks;
    }
    if (html) return appendNonTextBlocks(html, pickNonTextBlocks(lc, c));
    if (fromBlocks) return fromBlocks;
    const anyContent = c.find((x) => String(x?.content ?? "").trim() || (Array.isArray(x?.blocks) && x.blocks.length > 0));
    if (anyContent) {
      const h = String(anyContent?.content || "").trim();
      if (h) return appendNonTextBlocks(h, pickNonTextBlocks(anyContent, c));
      return blocksToHtml(anyContent?.blocks);
    }
  }
  if (typeof c === "string") return c.trim();
  return String(page?.body || "").trim();
}

/** HTML-содержимое записи локали (контент или блоки). */
function getPageEntryHtml(entry) {
  const html = String(entry?.content || "").trim();
  if (html.length >= MIN_CONTENT_LENGTH) return html;
  return blocksToHtml(entry?.blocks);
}

/** Текст без тегов и лишних пробелов — для сравнения локалей между собой. */
function normalizeComparableHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Запись целевой локали считается переводом только если она реально отличается
 * от русской версии. Бэкенд иногда создаёт tyv-запись с копией русского текста —
 * такую копию нужно перевести автоматически, иначе страница остаётся на русском.
 */
function isUntranslatedCopy(localizedEntry, content) {
  const ruEntry = content.find(
    (item) => String(item?.locale || "").toLowerCase() === "ru"
  );
  if (!ruEntry) return false;
  const localizedText = normalizeComparableHtml(getPageEntryHtml(localizedEntry));
  const ruText = normalizeComparableHtml(getPageEntryHtml(ruEntry));
  return Boolean(localizedText) && localizedText === ruText;
}

export function hasLocalizedPageHtml(page, locale) {
  if (!page) return false;
  const wantedLocale = String(locale || "").toLowerCase();
  const content = page?.content;
  if (Array.isArray(content)) {
    const localized = content.find(
      (item) => String(item?.locale || "").toLowerCase() === wantedLocale
    );
    if (!localized) return false;
    if (getPageEntryHtml(localized).length < MIN_CONTENT_LENGTH) return false;
    if (wantedLocale !== "ru" && isUntranslatedCopy(localized, content)) return false;
    return true;
  }
  const pageLocale = String(page?.locale || page?.language || "").toLowerCase();
  return pageLocale === wantedLocale && Boolean(extractPageHtml(page, wantedLocale));
}
