import React from "react";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

function normalizeUrl(url) {
  if (!url) return "";
  try {
    const normalized = normalizeFilesUrl(url);
    const absolute = new URL(normalized, window.location.origin).toString();
    return encodeURI(absolute);
  } catch {
    return encodeURI(String(url));
  }
}

export default function PdfPreviewModal({ open, onClose, url, title }) {
  const pdfSrc = React.useMemo(() => normalizeUrl(url), [url]);
  const [blobSrc, setBlobSrc] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    if (!pdfSrc) return;

    let cancelled = false;
    let objectUrl = "";

    (async () => {
      // Many servers disallow embedding via iframe (X-Frame-Options / CSP frame-ancestors),
      // which Chrome renders as "refused to connect". To avoid that, fetch as blob and
      // embed a blob: URL (works if CORS allows fetching the file).
      setLoading(true);
      setLoadError("");
      setBlobSrc("");
      try {
        const res = await fetch(pdfSrc, { method: "GET", mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setBlobSrc(objectUrl);
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            "Предпросмотр недоступен (ограничения сервера). Откройте документ в новой вкладке."
          );
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
                  <div style={{ padding: 12, color: "#6b7280" }}>Загрузка…</div>
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
                  <div style={{ padding: 12, color: "#b91c1c" }}>
                    {loadError || "Не удалось загрузить предпросмотр."}
                  </div>
                )}
              </div>
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
