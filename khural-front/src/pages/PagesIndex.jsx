import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";

export default function PagesIndex() {
  const { lang } = useI18n();
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const locale = lang === "ty" ? "tyv" : "ru";
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
  }, [lang]);

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
                    {p.title || p.name || p.slug}
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



