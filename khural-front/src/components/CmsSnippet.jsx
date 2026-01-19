import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import { extractPageHtml, getPreferredLocaleToken } from "../utils/pages.js";

/**
 * Renders HTML content from /pages by slug, inside an existing page.
 * Useful for "system routes" like /news, /documents etc to be editable in admin.
 */
export default function CmsSnippet({ slug, className = "card", style }) {
  const { lang } = useI18n();
  const locale = getPreferredLocaleToken(lang);
  const [html, setHtml] = React.useState("");

  React.useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      try {
        const page = await AboutApi.getPageBySlug(String(slug), { locale }).catch(() => null);
        if (!alive) return;
        setHtml(extractPageHtml(page, locale));
      } catch {
        if (!alive) return;
        setHtml("");
      }
    })();
    return () => {
      alive = false;
    };
  }, [locale, slug]);

  if (!html) return null;

  return (
    <div className={className} style={style}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

