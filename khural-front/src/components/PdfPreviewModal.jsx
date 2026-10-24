import React from "react";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import {
  canOpenInline,
  downloadName,
  embeddedViewerUrl,
  externalViewerUrl,
  isDocumentFileUrl,
  isHtmlBlob,
  isPdfBlob,
} from "../utils/documentFile.js";

/* ---------- helpers ---------- */

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

function toProxyUrl(url) {
  if (/\/api\/files\//i.test(url)) return url;
  if (/^https?:\/\/khural\.(?:yurta|rtyva)\.site\/upload\//i.test(url)) {
    return url.replace(/^https?:\/\/khural\.(?:yurta|rtyva)\.site/i, "");
  }
  return getFetchUrl(url);
}

async function probeFile(url) {
  const opts = { method: "GET", mode: "cors", credentials: "omit", headers: { Range: "bytes=0-0" } };
  const candidates = [...new Set([toProxyUrl(url), url].filter(Boolean))];
  let sawMissing = false;
  for (const candidate of candidates) {
    try {
      const res = await fetchWithTimeout(candidate, opts, PROBE_TIMEOUT_MS);
      if (res.status === 404 || res.status === 410) sawMissing = true;
      else if (res.status === 200 || res.status === 206) {
        const ct = String(res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html")) {
          sawMissing = true;
          continue;
        }
        return "ok";
      }
    } catch (_) { /* next */ }
  }
  return sawMissing ? "missing" : "unknown";
}

/* ---------- texts ---------- */

const MSG = {
  notAFile: {
    title: "Файл документа не найден на сервере",
    hint: "Ссылка ведёт на страницу сайта, а не на файл. Документ нужно загрузить заново в админке.",
  },
  missing: {
    title: "Документ недоступен: файл не найден или был удалён",
    hint: "",
  },
  failed: {
    title: "Не удалось загрузить документ для предпросмотра",
    hint: "",
  },
};

/* ---------- component ---------- */

export default function PdfPreviewModal({ open, onClose, url, title }) {
  const pdfSrc = React.useMemo(() => normalizeUrl(url), [url]);
  const [blobSrc, setBlobSrc] = React.useState("");
  const [status, setStatus] = React.useState("loading");
  const [directHref, setDirectHref] = React.useState("");
  const [downloadHref, setDownloadHref] = React.useState("");
  const [downloadAs, setDownloadAs] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setBlobSrc("");
      setStatus("loading");
      setDirectHref("");
      setDownloadHref("");
      setDownloadAs("");
      return;
    }
    if (!pdfSrc) {
      setStatus("failed");
      return;
    }

    // Ссылка ведёт не на файл — предпросмотра нет
    if (!isDocumentFileUrl(pdfSrc)) {
      setStatus("notAFile");
      return;
    }

    const inlineByExt = canOpenInline(pdfSrc);
    setDirectHref(inlineByExt ? pdfSrc : externalViewerUrl(pdfSrc));
    setDownloadHref(pdfSrc);
    setDownloadAs(downloadName(title, pdfSrc));

    let cancelled = false;
    let objectUrl = "";

    (async () => {
      setStatus("loading");
      setBlobSrc("");

      const opts = { method: "GET", mode: "cors", credentials: "omit" };
      try {
        let res = await fetchWithTimeout(toProxyUrl(pdfSrc), opts);
        if (!res.ok && /^https?:\/\/khural\.(?:yurta|rtyva)\.site/i.test(pdfSrc)) {
          res = await fetchWithTimeout(pdfSrc, opts);
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;

        // Сервер вернул HTML страницы сайта — не показываем внутри iframe
        if (await isHtmlBlob(blob)) {
          setStatus("notAFile");
          return;
        }

        // PDF по сигнатуре
        if (await isPdfBlob(blob)) {
          objectUrl = URL.createObjectURL(blob);
          setBlobSrc(objectUrl);
          setStatus("inline");
          setDirectHref(pdfSrc);
          return;
        }

        // Word/Excel/tiff и прочее — внешний просмотрщик
        setBlobSrc(embeddedViewerUrl(pdfSrc));
        setStatus("external");
        setDirectHref(externalViewerUrl(pdfSrc));
      } catch (e) {
        if (cancelled) return;
        const reachability = await probeFile(pdfSrc);
        if (cancelled) return;
        if (reachability === "missing") {
          console.warn("Документ недоступен на сервере:", e);
          setStatus("missing");
        } else {
          console.warn("Failed to load document as blob, using external viewer:", e);
          setBlobSrc(embeddedViewerUrl(pdfSrc));
          setStatus("external");
          setDirectHref(externalViewerUrl(pdfSrc));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, pdfSrc, title]);

  if (!open) return null;

  const error = MSG[status];

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
          {!pdfSrc ? (
            <div style={{ color: "#b91c1c" }}>Ссылка на документ отсутствует.</div>
          ) : (
            <>
              <div style={{ flex: 1, minHeight: 0 }}>
                {status === "loading" ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Загрузка документа…
                  </div>
                ) : error ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>
                    {error.title}
                    {error.hint ? (
                      <div style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>{error.hint}</div>
                    ) : null}
                    <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {(status === "missing" || status === "failed") && (
                        <a
                          href={directHref || pdfSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn"
                        >
                          Открыть в новой вкладке ↗
                        </a>
                      )}
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
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    Предпросмотр недоступен
                  </div>
                )}
              </div>
              {status === "external" ? (
                <div style={{ fontSize: 12, color: "#6b7280", padding: "8px 0", borderTop: "1px solid #e5e7eb" }}>
                  Формат файла браузер не показывает — используется внешний просмотрщик
                </div>
              ) : null}
              {!error ? (
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                  <a href={directHref || pdfSrc} target="_blank" rel="noopener noreferrer">
                    Открыть в новой вкладке ↗
                  </a>
                  <a href={downloadHref || pdfSrc} download={downloadAs || true}>
                    Скачать файл
                  </a>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
