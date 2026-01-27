import React from "react";
import { useHashRoute } from "../Router.jsx";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

function stripHtmlToText(input) {
  const s = String(input || "");
  if (!s.trim()) return "";
  try {
    if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
      const doc = new window.DOMParser().parseFromString(String(s), "text/html");
      const text = String(doc?.body?.textContent || "").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
  } catch {
    // ignore and fallback
  }
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDateAndDescription(raw) {
  const s = String(raw || "");
  const m = s.match(/^\s*(?:Дата события|Дата)\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\n?/i);
  if (m) {
    const date = m[1] || "";
    const rest = s.slice(m[0].length);
    return { date, body: rest.trimStart() };
  }
  const m2 = s.match(/^\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b\s*/);
  if (m2) {
    const date = m2[1] || "";
    const rest = s.slice(m2[0].length);
    return { date, body: rest.trimStart() };
  }
  return { date: "", body: s };
}

function formatRuDateMaybe(dateStr) {
  const s = String(dateStr || "").trim();
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  try {
    return d.toLocaleDateString("ru-RU");
  } catch {
    return s;
  }
}

export default function NewsSliderDetail() {
  const { slides, loading, errors, reload } = useData();
  const { route } = useHashRoute();
  const { t } = useI18n();

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

  const rawDesc = String(item?.desc ?? item?.description ?? item?.subtitle ?? "").trim();
  const plainDesc = stripHtmlToText(rawDesc);
  const { date, body } = splitDateAndDescription(plainDesc);
  const isHtml = looksLikeHtml(body);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/news/slider/${encodeURIComponent(String(slideId || ""))}`
      : `/news/slider/${encodeURIComponent(String(slideId || ""))}`;
  const shareTitle = String(item?.title || "").trim() || "Главные события недели";

  return (
    <section className="section">
      <div className="container">
        <DataState
          loading={Boolean(loading?.slides) && (!slides || slides.length === 0)}
          error={errors?.slides}
          onRetry={reload}
          empty={!loading?.slides && (!item || !slideId)}
          emptyDescription={slideId ? "Слайд не найден" : "Не указан ID слайда"}
        >
          <div>
            <div style={{ marginBottom: 16 }}>
              <a className="btn btn-back" href="/news/week" style={{ marginBottom: 16, display: "inline-block" }}>
                {t("back")}
              </a>
              <div>
                <h1 style={{ marginBottom: 8, display: "block" }}>{item?.title || "Главные события недели"}</h1>
                {date ? (
                  <div style={{ color: "#6b7280", marginBottom: 16 }}>
                    {formatRuDateMaybe(date)} · Главные события недели
                  </div>
                ) : (
                  <div style={{ color: "#6b7280", marginBottom: 16 }}>Главные события недели</div>
                )}
              </div>
            </div>

            <div className="news-detail">
              <article className="card" style={{ padding: 16 }}>
                {item?.image ? (
                  <div style={{ height: 340, overflow: "hidden", borderRadius: 12, background: "#f3f4f6" }}>
                    <img
                      src={normalizeFilesUrl(item.image)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
                    />
                  </div>
                ) : null}

                <div className="prose" style={{ marginTop: 16 }}>
                  {body ? (isHtml ? <div dangerouslySetInnerHTML={{ __html: body }} /> : <p>{body}</p>) : null}
                </div>

                <div
                  className="tile"
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="share-title">Поделиться</div>
                  <div className="share-icons" aria-label="Поделиться">
                    <a
                      className="share-sbtn share-sbtn--vk"
                      href={`https://vk.com/share.php?url=${encodeURIComponent(
                        shareUrl
                      )}&title=${encodeURIComponent(shareTitle)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Поделиться во ВКонтакте"
                      title="ВКонтакте"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="100"
                        height="100"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path fill="#1976d2" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                        <path
                          fill="#fff"
                          d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"
                        ></path>
                      </svg>
                    </a>
{/* 
                    <a
                      className="share-sbtn share-sbtn--ok"
                      href="https://ok.ru"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Одноклассники"
                      title="Одноклассники"
                    >
                      <img
                        src="data:image/png;base64,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"
                        alt="odnoklassniki-circled"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </a> */}

                    <a
                      className="share-sbtn share-sbtn--tg"
                      href={`https://t.me/share/url?url=${encodeURIComponent(
                        shareUrl
                      )}&text=${encodeURIComponent(shareTitle)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Поделиться в Telegram"
                      title="Telegram"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        x="0px"
                        y="0px"
                        width="100"
                        height="100"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path fill="#29b6f6" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
                        <path
                          fill="#fff"
                          d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                        ></path>
                        <path
                          fill="#b0bec5"
                          d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                        ></path>
                        <path
                          fill="#cfd8dc"
                          d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                        ></path>
                      </svg>
                    </a>

                    <button
                      type="button"
                      className="share-sbtn share-sbtn--copy"
                      aria-label="Скопировать ссылку"
                      title="Скопировать ссылку"
                      onClick={async (event) => {
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          // Показываем уведомление об успешном копировании
                          const btn = event.currentTarget;
                          const originalTitle = btn.title;
                          btn.title = "✓ Ссылка скопирована!";
                          btn.style.opacity = "0.7";
                          setTimeout(() => {
                            btn.title = originalTitle;
                            btn.style.opacity = "1";
                          }, 2000);
                        } catch {
                          // Показываем ошибку
                          const btn = event.currentTarget;
                          const originalTitle = btn.title;
                          btn.title = "✗ Не удалось скопировать";
                          setTimeout(() => {
                            btn.title = originalTitle;
                          }, 2000);
                        }
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>

              <aside>
                <h3 style={{ marginBottom: 8 }}>Другие события</h3>
                <div className="grid">
                  {(Array.isArray(slides) ? slides : [])
                    .filter((s) => String(s?.id ?? "") !== String(slideId || ""))
                    .slice(0, 6)
                    .map((s) => {
                      const id = String(s?.id ?? "").trim();
                      const title = String(s?.title || "").trim() || "—";
                      const raw = String(s?.desc ?? s?.description ?? s?.subtitle ?? "");
                      const plain = stripHtmlToText(raw);
                      const { date: d } = splitDateAndDescription(plain);
                      return (
                        <a
                          key={id || title}
                          className="tile link"
                          href={`/news/slider/${encodeURIComponent(id)}`}
                          style={{ display: "block", padding: 12 }}
                        >
                          {d ? (
                            <div style={{ fontSize: 14, color: "#6b7280" }}>{formatRuDateMaybe(d)}</div>
                          ) : null}
                          <div style={{ fontWeight: 700 }}>{title}</div>
                        </a>
                      );
                    })}
                </div>
              </aside>
            </div>
          </div>
        </DataState>
      </div>
    </section>
  );
}

