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
  const maxItems = 6; // На главной только последние 6, остальные — на странице /news

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
  
  const filtered = React.useMemo(
    () => (allFiltered || []).slice(0, maxItems),
    [allFiltered, maxItems]
  );

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
        </DataState>
      </div>
    </section>
  );
}
