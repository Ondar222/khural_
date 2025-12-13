import React from "react";
import { createPortal } from "react-dom";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";

export default function SearchModal({ open, onClose }) {
  const { news, documents } = useData();
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
    return () => {
      document.body.style.overflow = "";
      setQuery("");
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (!q) return [];
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
  }, [q, news, documents]);

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
            {q && results.length === 0 && (
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
