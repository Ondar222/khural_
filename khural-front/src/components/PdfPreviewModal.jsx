import React from "react";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

// Итоговая ссылка: https://khural.rtyva.ru/upload/iblock/.../имя файла.pdf (без %-кодирования в пути)
function normalizeUrl(url) {
  if (!url) return "";
  const normalized = normalizeFilesUrl(url);
  if (!normalized) return "";
  if (normalized.startsWith("http")) return normalized;
  try {
    return new URL(normalized, window.location.origin).toString();
  } catch {
    return normalized;
  }
}

/** На продакшене запрос к API/файлам через тот же origin (rewrite /files -> backend), чтобы не было CORS. */
function getFetchUrl(pdfUrl) {
  if (!pdfUrl || typeof pdfUrl !== "string") return pdfUrl;
  try {
    const pageOrigin = typeof window !== "undefined" ? window.location.origin : "";
    const url = new URL(pdfUrl);
    if (url.origin === pageOrigin) return pdfUrl;
    const apiBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "";
    const filesBase = (typeof import.meta !== "undefined" && import.meta.env?.VITE_FILES_BASE_URL) || "";
    for (const base of [apiBase, filesBase].filter((b) => b && String(b).startsWith("http"))) {
      try {
        const baseUrl = new URL(base);
        if (url.origin === baseUrl.origin) return url.pathname + url.search;
      } catch (_) {}
    }
  } catch (_) {}
  return pdfUrl;
}

const FETCH_TIMEOUT_MS = 25000;
const PROBE_TIMEOUT_MS = 12000;

function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

/** Запрос к файлу через прокси /pdf-proxy, если он лежит на khural.rtyva.ru (обход CORS). */
function toProxyUrl(url) {
  if (url.includes("khural.rtyva.ru")) return url.replace("https://khural.rtyva.ru", "/pdf-proxy");
  return getFetchUrl(url);
}

/**
 * Проверяем доступность файла: "ok" — отдаётся сервером, "missing" — явный 404/410,
 * "unknown" — сеть/CORS/таймаут (в этом случае предпросмотр всё равно пробуем показать).
 */
async function probeFile(url) {
  const opts = { method: "GET", mode: "cors", credentials: "omit", headers: { Range: "bytes=0-0" } };
  const candidates = [...new Set([toProxyUrl(url), url].filter(Boolean))];
  let sawMissing = false;
  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, opts, PROBE_TIMEOUT_MS);
      if (res.status === 200 || res.status === 206) return "ok";
      if (res.status === 404 || res.status === 410) sawMissing = true;
    } catch (_) {
      /* пробуем следующий вариант */
    }
  }
  return sawMissing ? "missing" : "unknown";
}

// Используем Google Docs Viewer как fallback для обхода X-Frame-Options
function getGoogleDocsViewerUrl(pdfUrl) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}

/** Определяем, является ли ссылка PDF (по расширению в пути). */
function isPdfUrl(url) {
  return /\.pdf(?:$|\?|#)/i.test(String(url || ""));
}

export default function PdfPreviewModal({ open, onClose, url, title }) {
  const pdfSrc = React.useMemo(() => normalizeUrl(url), [url]);
  const [blobSrc, setBlobSrc] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = React.useState(false);
  const [unavailable, setUnavailable] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setBlobSrc("");
      setUseGoogleViewer(false);
      setUnavailable(false);
      return;
    }
    if (!pdfSrc) return;

    let cancelled = false;
    let objectUrl = "";

    (async () => {
      setLoading(true);
      setBlobSrc("");
      setUseGoogleViewer(false);
      setUnavailable(false);

      // Документы Word/Excel/др. нельзя отрисовать в <iframe> как PDF —
      // для них используем внешний просмотрщик, но только если файл реально доступен.
      if (!isPdfUrl(pdfSrc)) {
        const reachability = await probeFile(pdfSrc);
        if (cancelled) return;
        if (reachability === "missing") {
          setUnavailable(true);
          setLoading(false);
          return;
        }
        setUseGoogleViewer(true);
        setBlobSrc(getGoogleDocsViewerUrl(pdfSrc));
        setLoading(false);
        return;
      }

      const isKhuralDomain = pdfSrc.includes("khural.rtyva.ru");
      const fetchUrl = isKhuralDomain ? pdfSrc.replace("https://khural.rtyva.ru", "/pdf-proxy") : getFetchUrl(pdfSrc);

      const opts = {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        headers: { Accept: "application/pdf" },
      };

      try {
        let res = await fetchWithTimeout(fetchUrl, opts);
        if (!res.ok && isKhuralDomain) {
          res = await fetchWithTimeout(pdfSrc, opts);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (blob.type !== "application/pdf") {
          throw new Error("Not a PDF file");
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobSrc(objectUrl);
      } catch (e) {
        if (!cancelled) {
          const reachability = await probeFile(pdfSrc);
          if (cancelled) return;
          if (reachability === "missing") {
            console.warn("Документ недоступен на сервере:", e);
            setUnavailable(true);
          } else {
            console.warn("Failed to load PDF as blob, using Google Docs Viewer:", e);
            setUseGoogleViewer(true);
            setBlobSrc(getGoogleDocsViewerUrl(pdfSrc));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, pdfSrc]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ width: "min(1100px, 96vw)", height: "86vh" }}>
        <button className="icon-btn modal__close" aria-label="Закрыть" onClick={onClose}>
          ✕
        </button>
        <div
          className="modal__content"
          style={{ height: "calc(86vh - 48px)", display: "flex", flexDirection: "column", gap: 8 }}
        >
          <div style={{ fontWeight: 800 }}>{title || "Предварительный просмотр"}</div>
          {pdfSrc ? (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                {loading ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Загрузка документа…
                  </div>
                ) : unavailable ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>
                    Документ недоступен на сервере: файл не найден или был удалён.
                    <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      <a href={pdfSrc} target="_blank" rel="noopener noreferrer" className="btn">
                        Попробовать открыть в новой вкладке ↗
                      </a>
                      <button type="button" className="btn" onClick={onClose}>
                        Закрыть
                      </button>
                    </div>
                  </div>
                ) : blobSrc ? (
                  <iframe
                    key={blobSrc}
                    title="Предварительный просмотр документа"
                    src={blobSrc}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      width: "100%",
                      height: "100%",
                    }}
                  />
                ) : (
                  <div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>
                    Не удалось загрузить документ для предпросмотра.
                    <div style={{ marginTop: 12 }}>
                      <a href={pdfSrc} target="_blank" rel="noopener noreferrer" className="btn">
                        Открыть в новой вкладке ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
              {useGoogleViewer && !unavailable && (
                <div style={{ fontSize: 12, color: "#6b7280", padding: "8px 0", borderTop: "1px solid #e5e7eb" }}>
                  Используется внешний просмотрщик для обхода ограничений сервера
                </div>
              )}
              {!unavailable && (
                <div style={{ fontSize: 13, color: "#555" }}>
                  <a href={pdfSrc} target="_blank" rel="noopener noreferrer">
                    Открыть в новой вкладке ↗
                  </a>
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "#b91c1c" }}>Ссылка на документ отсутствует.</div>
          )}
        </div>
      </div>
    </div>
  );
}