import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function stripHtmlToText(input) {
  const s = String(input || "");
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateWords(text, maxWords) {
  const s = String(text || "").trim();
  if (!s) return "";
  const words = s.split(/\s+/).filter(Boolean);
  const n = Number(maxWords || 0);
  if (!n || words.length <= n) return s;
  return words.slice(0, n).join(" ") + "…";
}

function splitDateAndDescription(text) {
  const s = String(text || "");
  const m = s.match(/^\s*(?:Дата события|Дата)\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\n?/i);
  if (m) {
    const date = m[1] || "";
    const rest = s.slice(m[0].length).trimStart();
    return { date, description: rest };
  }
  const m2 = s.match(/^\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b\s*/);
  if (m2) {
    const date = m2[1] || "";
    const rest = s.slice(m2[0].length).trimStart();
    return { date, description: rest };
  }
  return { date: "", description: s };
}

export default function NewsWeekHighlights() {
  const { slides, loading, errors, reload } = useData();
  const { t } = useI18n();

  const items = React.useMemo(() => {
    const list = Array.isArray(slides) ? slides : [];
    return list.slice(0, 5);
  }, [slides]);

  return (
    <section className="section">
      <div className="container">
        <a className="btn btn-back" href="/news" style={{ marginBottom: 16, display: "inline-block" }}>
          {t("back")}
        </a>

        <h1 className="no-gold-underline">Главные события недели</h1>

        <DataState
          loading={Boolean(loading?.slides) && (!slides || slides.length === 0)}
          error={errors?.slides}
          onRetry={reload}
          empty={!loading?.slides && items.length === 0}
          emptyDescription="Пока нет слайдов"
        >
          <div className="grid cols-3" style={{ marginTop: 16 }}>
            {items.map((s) => {
              const id = String(s?.id ?? "").trim();
              const title = String(s?.title || "").trim();
              const raw = stripHtmlToText(s?.desc ?? s?.description ?? s?.subtitle ?? "");
              const { date, description } = splitDateAndDescription(raw);
              const subtitle = String(description || "").trim();
              const subtitlePreview = truncateWords(subtitle, 30);
              const preview = `${subtitlePreview}${subtitlePreview && date ? " " : ""}${date || ""}`.trim();
              const href = id ? `/news/slider/${encodeURIComponent(id)}` : "/news";
              return (
                <a key={id || title || Math.random()} className="tile" href={href} style={{ overflow: "hidden", padding: 0 }}>
                  {s?.image ? (
                    <div style={{ height: 180, overflow: "hidden" }}>
                      <img
                        src={normalizeFilesUrl(s.image)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  ) : null}
                  <div style={{ padding: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{title || "—"}</div>
                    {preview ? <div style={{ marginTop: 8, color: "#6b7280" }}>{preview}</div> : null}
                    <div style={{ marginTop: 12, fontWeight: 800, color: "var(--link)" }}>Подробнее →</div>
                  </div>
                </a>
              );
            })}
          </div>
        </DataState>
      </div>
    </section>
  );
}

