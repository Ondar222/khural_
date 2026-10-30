import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import { useAutomaticTranslation } from "../hooks/useTranslation.js";
import {
  extractPageHtml,
  getPreferredLocaleToken,
  hasLocalizedPageHtml,
} from "../utils/pages.js";

/**
 * Renders HTML content from /pages by slug, inside an existing page.
 * Useful for "system routes" like /news, /documents etc to be editable in admin.
 */
export default function CmsSnippet({ slug, className = "card", style }) {
  const { lang } = useI18n();
  const locale = getPreferredLocaleToken(lang);
  const [html, setHtml] = React.useState("");
  const [hasTranslation, setHasTranslation] = React.useState(false);
  const displayHtml = useAutomaticTranslation(html, lang === "ty" && !hasTranslation);

  React.useEffect(() => {
    if (!slug) return;
    const slugStr = String(slug);
    // Не запрашивать "home", если на бэкенде нет такой страницы — избегаем 404 в Network
    if (slugStr === "home") {
      setHtml("");
      return;
    }
    let alive = true;
    (async () => {
      try {
        const page = await AboutApi.getPageBySlug(slugStr, { locale }).catch(() => null);
        if (!alive) return;
        setHtml(extractPageHtml(page, locale) || "");
        setHasTranslation(hasLocalizedPageHtml(page, locale));
      } catch {
        if (!alive) return;
        setHtml("");
        setHasTranslation(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [locale, slug]);

  if (!html) return null;

  return (
    <div className={className} style={style}>
      <div data-no-auto-translate dangerouslySetInnerHTML={{ __html: displayHtml }} />
    </div>
  );
}
