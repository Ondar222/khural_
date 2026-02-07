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

function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
}

// Используем Google Docs Viewer как fallback для обхода X-Frame-Options
function getGoogleDocsViewerUrl(pdfUrl) {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
}

export default function PdfPreviewModal({ open, onClose, url, title }) {
  const pdfSrc = React.useMemo(() => normalizeUrl(url), [url]);
  const [blobSrc, setBlobSrc] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setBlobSrc("");
      setUseGoogleViewer(false);
      return;
    }
    if (!pdfSrc) return;

    let cancelled = false;
    let objectUrl = "";

    (async () => {
      setLoading(true);
      setBlobSrc("");
      setUseGoogleViewer(false);

      const isKhuralDomain = pdfSrc.includes("khural.rtyva.ru");
      const fetchUrl =
        isKhuralDomain
          ? pdfSrc.replace("https://khural.rtyva.ru", "/pdf-proxy")
          : getFetchUrl(pdfSrc);

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
        if (blob.type !== "application/pdf" && !String(pdfSrc).toLowerCase().includes(".pdf")) {
          throw new Error("Not a PDF file");
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobSrc(objectUrl);
      } catch (e) {
        if (!cancelled) {
          console.warn("Failed to load PDF as blob, using Google Docs Viewer:", e);
          setUseGoogleViewer(true);
          setBlobSrc(getGoogleDocsViewerUrl(pdfSrc));
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
                ) : blobSrc ? (
                  <iframe
                    key={blobSrc}
                    title="PDF preview"
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
              {useGoogleViewer && (
                <div style={{ fontSize: 12, color: "#6b7280", padding: "8px 0", borderTop: "1px solid #e5e7eb" }}>
                  Используется внешний просмотрщик для обхода ограничений сервера
                </div>
              )}
              <div style={{ fontSize: 13, color: "#555" }}>
                <a href={pdfSrc} target="_blank" rel="noopener noreferrer">
                  Открыть в новой вкладке ↗
                </a>
              </div>
            </>
          ) : (
            <div style={{ color: "#b91c1c" }}>Ссылка на документ отсутствует.</div>
          )}
        </div>
      </div>
    </div>
  );
}
