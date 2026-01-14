import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "./DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

export default function NewsBlock() {
  const { news, loading, errors, reload } = useData();
  const { t } = useI18n();
  const [category, setCategory] = React.useState("Все");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 6; // Показываем 6 новостей на странице
  
  const normalizeCategoryKey = React.useCallback((v) => {
    return String(v ?? "")
      .replace(/\u00A0/g, " ") // NBSP
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, "-") // unicode dashes -> '-'
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }, []);
  
  const categories = React.useMemo(
    () => {
      const byKey = new Map();
      (news || []).forEach((n) => {
        const raw = String(n?.category ?? "").trim();
        const key = normalizeCategoryKey(raw);
        if (!key || key === "все") return;
        if (!byKey.has(key)) byKey.set(key, raw);
      });
      return ["Все", ...Array.from(byKey.values())];
    },
    [news, normalizeCategoryKey]
  );
  
  const allFiltered = React.useMemo(
    () =>
      category === "Все"
        ? news
        : (news || []).filter(
            (n) => normalizeCategoryKey(n?.category) === normalizeCategoryKey(category)
          ),
    [news, category, normalizeCategoryKey]
  );
  
  const totalPages = Math.ceil((allFiltered?.length || 0) / itemsPerPage);
  
  const filtered = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return (allFiltered || []).slice(start, end);
  }, [allFiltered, currentPage, itemsPerPage]);
  
  // Сброс на первую страницу при смене категории
  React.useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>
            <a className="link" href="/news" style={{ textDecoration: "none" }}>
              {t("news")}
            </a>
          </h2>
          <a className="link" href="/news">
            {t("news")} →
          </a>
        </div>
        <DataState
          loading={Boolean(loading?.news) && (!news || news.length === 0)}
          error={errors?.news}
          onRetry={reload}
          empty={!loading?.news && (!news || news.length === 0)}
          emptyDescription="Новостей пока нет"
        >
          {/* Desktop: pills. Mobile: single select */}
          <div className="news-cats news-cats--select">
            <label className="news-filter">
              <span className="news-filter__label">Категория</span>
              <select
                className="news-filter-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Фильтр новостей по категории"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="news-cats news-cats--pills">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="btn"
                style={{ background: c === category ? "#eef2ff" : "#fff" }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="grid cols-3">
            {filtered.map((n, i) => (
              <a
                key={`${String(n?.id ?? "news")}-${String(n?.date ?? "")}-${i}`}
                className="tile"
                href={`/news?id=${n.id}`}
                style={{ overflow: "hidden", padding: 0 }}
              >
                {n?.image ? (
                  <div style={{ height: 180, overflow: "hidden" }}>
                    <img
                      src={normalizeFilesUrl(n.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                ) : null}
                <div style={{ padding: 16 }}>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#eef2ff",
                      color: "#3730a3",
                      borderRadius: 8,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {n.category}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{n.title}</div>
                  <div style={{ color: "#6b7280", marginTop: 6 }}>
                    {new Date(n.date).toLocaleDateString("ru-RU")}
                  </div>
                </div>
              </a>
            ))}
          </div>
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <button
                className="btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
                aria-label="Предыдущая страница"
              >
                ← Назад
              </button>
              
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className="btn"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        background: currentPage === pageNum ? "#003366" : "#fff",
                        color: currentPage === pageNum ? "#fff" : "#003366",
                        border: "1px solid #003366",
                        minWidth: 40,
                      }}
                      aria-label={`Страница ${pageNum}`}
                      aria-current={currentPage === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
                aria-label="Следующая страница"
              >
                Вперёд →
              </button>
              
              <div style={{ fontSize: 14, color: "#6b7280", marginLeft: 8 }}>
                Страница {currentPage} из {totalPages}
              </div>
            </div>
          )}
        </DataState>
      </div>
    </section>
  );
}
