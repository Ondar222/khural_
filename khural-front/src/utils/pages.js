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

export function extractPageHtml(page, locale) {
  if (!page) return "";
  const c = page?.content;
  if (Array.isArray(c)) {
    const lc = pickLocalizedContent(page, locale);
    return String(lc?.content || "").trim();
  }
  // legacy shape: content is a string
  if (typeof c === "string") return c.trim();
  return String(page?.body || "").trim();
}

