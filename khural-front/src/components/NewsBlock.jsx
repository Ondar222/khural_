import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "./DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { formatNewsDateTime } from "../utils/dateFormat.js";

export default function NewsBlock() {
  const { news, loading, errors, reload } = useData();
  const { t, lang } = useI18n();
  const maxItems = 6; // На главной только последние 6, остальные — на странице /news

  const filtered = React.useMemo(
    () => (news || []).slice(0, maxItems),
    [news, maxItems]
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
          {/* Фильтр по категориям скрыт, пока категории не будут приведены в порядок */}
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
                    <div className="news-block__card-title">{(lang === "ty" && n.titleTy) ? n.titleTy : n.title}</div>
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
