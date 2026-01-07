import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";

function getSlugFromPath() {
  const path = typeof window !== "undefined" ? window.location.pathname || "" : "";
  if (path.startsWith("/p/")) return decodeURIComponent(path.slice(3));
  return "";
}

export default function PageBySlug() {
  const { lang } = useI18n();
  const [slug, setSlug] = React.useState(() => getSlugFromPath());
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const update = () => setSlug(getSlugFromPath());
    window.addEventListener("popstate", update);
    window.addEventListener("app:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("app:navigate", update);
    };
  }, []);

  React.useEffect(() => {
    if (!slug) return;
    const locale = lang === "ty" ? "tyv" : "ru";
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await AboutApi.getPageBySlug(slug, { locale });
        if (!alive) return;
        setPage(res || null);
      } catch (e) {
        if (!alive) return;
        setError(e);
        setPage(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang, slug]);

  const title = page?.title || page?.name || slug;
  const html = String(page?.content || page?.body || "");

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{title}</h1>
        <DataState loading={loading} error={error} empty={!loading && !page} emptyDescription="Страница не найдена">
          <div className="card" style={{ padding: 18 }}>
            {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <div>—</div>}
          </div>
        </DataState>
      </div>
    </section>
  );
}



