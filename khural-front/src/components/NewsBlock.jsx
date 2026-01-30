import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "./DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { formatNewsDateTime } from "../utils/dateFormat.js";

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

  // Прокрутка вверх при смене страницы
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <section className="section news-block">
      <div className="container">
        <div className="section-head news-block__head">
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
          {/* Десктоп: табы-пилюли. Адаптив: те же табы, компактно */}
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

          <div className="news-cats news-cats--pills news-block__pills">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className="btn news-block__pill"
                style={{ background: c === category ? "#eef2ff" : "#fff" }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="home-news__scroller news-block__scroller">
            <div className="grid cols-3 home-news__list news-block__list">
              {filtered.map((n, i) => (
                <a
                  key={`${String(n?.id ?? "news")}-${String(n?.date ?? "")}-${i}`}
                  className="tile news-block__card"
                  href={`/news?id=${n.id}`}
                  style={{ overflow: "hidden", padding: 0 }}
                >
                  {n?.image ? (
                    <div className="news-block__card-img-wrap">
                      <img
                        src={normalizeFilesUrl(n.image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : null}
                  <div className="news-block__card-body">
                    <span className="news-block__card-cat">{n.category}</span>
                    <div className="news-block__card-title">{n.title}</div>
                    <div className="news-block__card-date">{formatNewsDateTime(n.date)}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
          
          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="news-block__pagination" style={{ 
              marginTop: 24, 
              display: "flex", 
              justifyContent: "flex-end", 
              alignItems: "center", 
              gap: 6,
              flexWrap: "wrap" 
            }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: currentPage === 1 ? "#9ca3af" : "#374151",
                  background: currentPage === 1 ? "#f3f4f6" : "#ffffff",
                  border: `1px solid ${currentPage === 1 ? "#e5e7eb" : "#d1d5db"}`,
                  borderRadius: 6,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  minHeight: 32,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.background = "#f9fafb";
                    e.target.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.target.style.background = "#ffffff";
                    e.target.style.borderColor = "#d1d5db";
                  }
                }}
                aria-label="Предыдущая страница"
              >
                ← Назад
              </button>
              
              <div style={{ 
                display: "flex", 
                gap: 3, 
                alignItems: "center",
                background: "#f9fafb",
                padding: 3,
                borderRadius: 6,
              }}>
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
                  
                  const isActive = currentPage === pageNum;
                  
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      className="news-block__page-num"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 32,
                        height: 32,
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#ffffff" : "#374151",
                        background: isActive ? "#003366" : "transparent",
                        border: "none",
                        borderRadius: 5,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.target.style.background = "#e5e7eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.target.style.background = "transparent";
                        }
                      }}
                      aria-label={`Страница ${pageNum}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 12px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: currentPage === totalPages ? "#9ca3af" : "#374151",
                  background: currentPage === totalPages ? "#f3f4f6" : "#ffffff",
                  border: `1px solid ${currentPage === totalPages ? "#e5e7eb" : "#d1d5db"}`,
                  borderRadius: 6,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  minHeight: 32,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.background = "#f9fafb";
                    e.target.style.borderColor = "#9ca3af";
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.target.style.background = "#ffffff";
                    e.target.style.borderColor = "#d1d5db";
                  }
                }}
                aria-label="Следующая страница"
              >
                Вперёд →
              </button>
            </div>
          )}
        </DataState>
      </div>
    </section>
  );
}
