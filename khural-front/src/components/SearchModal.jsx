import React from "react";
import { createPortal } from "react-dom";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { SearchApi } from "../api/client.js";

export default function SearchModal({ open, onClose }) {
  const { news, documents } = useData();
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [remote, setRemote] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
    return () => {
      document.body.style.overflow = "";
      setQuery("");
      setRemote([]);
      setLoading(false);
    };
  }, [open]);

  const q = query.trim().toLowerCase();

  // Remote search (debounced)
  React.useEffect(() => {
    if (!open) return;
    const qq = query.trim();
    if (!qq || qq.length < 2) {
      setRemote([]);
      return;
    }
    let alive = true;
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await SearchApi.search({ query: qq, contentType: "all", page: 1, limit: 20 });
        if (!alive) return;
        const results = Array.isArray(res?.results) ? res.results : [];
        setRemote(
          results.map((r) => {
            const type = r.type;
            const baseMeta = Array.isArray(r.highlights) && r.highlights.length ? r.highlights[0] : (r.description || "");
            if (type === "persons") {
              return {
                id: `p-${r.id}`,
                type: "person",
                title: r.title,
                meta: baseMeta,
                href: `#/government?type=dep&id=${encodeURIComponent(r.id)}`,
              };
            }
            if (type === "documents") {
              return {
                id: `d-${r.id}`,
                type: "document",
                title: r.title,
                meta: baseMeta,
                href: "#/documents",
              };
            }
            // news
            return {
              id: `n-${r.id}`,
              type: "news",
              title: r.title,
              meta: baseMeta,
              href: "#/news",
            };
          })
        );
      } catch {
        if (alive) setRemote([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [open, query]);

  const results = React.useMemo(() => {
    if (!q) return [];
    if (remote.length) return remote;
    const newsMatches = news
      .filter((n) =>
        [n.title, n.desc]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      )
      .map((n) => ({
        id: `news-${n.id}`,
        type: "news",
        title: n.title,
        meta: new Date(n.date).toLocaleDateString("ru-RU"),
        href: "#/news",
      }));
    const docMatches = documents
      .filter((d) =>
        [d.title, d.summary]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      )
      .map((d) => ({
        id: `doc-${d.id || d.title}`,
        type: "document",
        title: d.title,
        meta: d.category || "",
        href: "#/documents",
      }));
    return [...newsMatches, ...docMatches].slice(0, 20);
  }, [q, news, documents, remote]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="icon-btn modal__close"
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>
        <div className="modal__content">
          <div className="search-form">
            <input
              ref={inputRef}
              type="search"
              placeholder={t("search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
              aria-label={t("search")}
            />
            <button
              className="btn"
              onClick={() => inputRef.current && inputRef.current.focus()}
            >
              🔍
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            {q && loading && (
              <div className="text-muted">Поиск…</div>
            )}
            {q && !loading && results.length === 0 && (
              <div className="text-muted">Ничего не найдено</div>
            )}
            {results.length > 0 && (
              <div className="grid">
                {results.map((r) => (
                  <a
                    key={r.id}
                    className="tile link"
                    href={r.href}
                    onClick={onClose}
                    style={{ display: "block" }}
                  >
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {r.type === "news" ? "Новости" : "Документы"}
                      {r.meta ? ` · ${r.meta}` : ""}
                    </div>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
