import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "./DataState.jsx";

export default function NewsBlock() {
  const { news, loading, errors, reload } = useData();
  const { t } = useI18n();
  const [category, setCategory] = React.useState("Все");
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
  const filtered = React.useMemo(
    () =>
      (category === "Все"
        ? news
        : (news || []).filter(
            (n) => normalizeCategoryKey(n?.category) === normalizeCategoryKey(category)
          )
      ).slice(0, 5),
    [news, category, normalizeCategoryKey]
  );

  const getImage = (i) => {
    const imgs = [
      "/img/news1.jpeg",
      "/img/news2.jpeg",
      "/img/news3.jpeg",
      "/img/news4.jpeg",
      "/img/news5.jpeg",
    ];
    return imgs[i % imgs.length];
  };

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
                <div style={{ height: 180, overflow: "hidden" }}>
                  <img
                    src={n?.image || getImage(i)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      // fallback for any unsupported/broken/cross-origin image
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = getImage(i);
                    }}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
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
        </DataState>
      </div>
    </section>
  );
}
