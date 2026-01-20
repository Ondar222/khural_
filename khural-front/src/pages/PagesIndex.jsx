import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";
import { getPreferredLocaleToken } from "../utils/pages.js";
import { pickMenuLabel } from "../utils/pagesOverrides.js";

export default function PagesIndex() {
  const { lang } = useI18n();
  const locale = getPreferredLocaleToken(lang);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await AboutApi.listPages({ locale });
        if (!alive) return;
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        setItems(arr);
      } catch (e) {
        if (!alive) return;
        setError(e);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang, locale]);

  return (
    <section className="section">
      <div className="container">
        <h1>Страницы</h1>
        <DataState loading={loading} error={error} empty={!loading && items.length === 0} emptyDescription="Страниц нет">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {(items || []).map((p) => {
                const slug = String(p.slug || "");
                const segs = slug.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
                const href = `/p/${segs.join("/")}`;
                return (
                  <a
                    key={String(p.id || p.slug || Math.random())}
                    className="link"
                    href={href}
                    style={{ fontWeight: 700 }}
                  >
                    {pickMenuLabel(p, locale, { prefer: "menu" }) || p.slug}
                  </a>
                );
              })}
            </div>
          </div>
        </DataState>
      </div>
    </section>
  );
}



