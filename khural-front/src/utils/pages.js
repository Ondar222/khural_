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
      const href = String(b?.url ?? b?.href ?? "#").trim();
      const label = caption || content || href;
      return `<div class="page-block page-block--link"><a href="${href}">${label}</a></div>`;
    }
    if (type === "file") {
      const link = b?.file?.link ?? b?.link ?? "";
      const label = caption || content || "Документ";
      return link ? `<div class="page-block page-block--file"><a href="${link}">${label}</a></div>` : "";
    }
    return content ? `<div class="page-block">${content}</div>` : "";
  });
  return parts.filter(Boolean).join("\n");
}

/** Минимальная длина контента, чтобы считать его «непустым» (иначе показываем другую локаль). */
const MIN_CONTENT_LENGTH = 80;

export function extractPageHtml(page, locale) {
  if (!page) return "";
  const c = page?.content;
  if (Array.isArray(c)) {
    const lc = pickLocalizedContent(page, locale);
    let html = String(lc?.content || "").trim();
    let fromBlocks = blocksToHtml(lc?.blocks);
    if (html.length >= MIN_CONTENT_LENGTH) return html;
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
      if (h.length >= MIN_CONTENT_LENGTH) return h;
      const fbBlocks = blocksToHtml(fallback?.blocks);
      if (fbBlocks) return fbBlocks;
    }
    if (html) return html;
    if (fromBlocks) return fromBlocks;
    const anyContent = c.find((x) => String(x?.content ?? "").trim() || (Array.isArray(x?.blocks) && x.blocks.length > 0));
    if (anyContent) {
      const h = String(anyContent?.content || "").trim();
      if (h) return h;
      return blocksToHtml(anyContent?.blocks);
    }
  }
  if (typeof c === "string") return c.trim();
  return String(page?.body || "").trim();
}

