import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

export default function NewsSliderDetail() {
  const { slides, loading, errors, reload } = useData();
  const { t } = useI18n();
  const { route } = useHashRoute();

  const slideId = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    if (typeof window !== "undefined" && window.__routeParams && window.__routeParams.id) {
      return String(window.__routeParams.id);
    }
    const match = base.match(/\/news\/slider\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [route]);

  const item = React.useMemo(() => {
    const list = Array.isArray(slides) ? slides : [];
    const id = String(slideId || "").trim();
    if (!id) return null;
    return list.find((s) => String(s?.id ?? "") === id) || null;
  }, [slides, slideId]);

  const desc = String(item?.desc ?? item?.description ?? item?.subtitle ?? "").trim();
  const isHtml = looksLikeHtml(desc);

  return (
    <section className="section">
      <div className="container">
        <a className="btn btn-back" href="/news" style={{ marginBottom: 16, display: "inline-block" }}>
          {t("back")}
        </a>

        <h1 className="no-gold-underline" style={{ marginBottom: 10 }}>
          Главные события недели
        </h1>

        <DataState
          loading={Boolean(loading?.slides) && (!slides || slides.length === 0)}
          error={errors?.slides}
          onRetry={reload}
          empty={!loading?.slides && (!item || !slideId)}
          emptyDescription={slideId ? "Слайд не найден" : "Не указан ID слайда"}
        >
          <article className="card" style={{ padding: 16 }}>
            {item?.image ? (
              <div style={{ height: 340, overflow: "hidden", borderRadius: 12 }}>
                <img
                  src={normalizeFilesUrl(item.image)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ) : null}

            <div className="prose" style={{ marginTop: 16 }}>
              {item?.title ? <h2 style={{ marginTop: 0 }}>{item.title}</h2> : null}
              {desc ? (isHtml ? <div dangerouslySetInnerHTML={{ __html: desc }} /> : <p>{desc}</p>) : null}
            </div>
          </article>
        </DataState>
      </div>
    </section>
  );
}

