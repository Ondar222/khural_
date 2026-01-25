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
      // Пробуем загрузить PDF как blob для обхода X-Frame-Options
      setLoading(true);
      setBlobSrc("");
      setUseGoogleViewer(false);
      
      // Если PDF находится на khural.rtyva.ru, пробуем использовать прокси
      const isKhuralDomain = pdfSrc.includes("khural.rtyva.ru");
      const proxyUrl = isKhuralDomain 
        ? pdfSrc.replace("https://khural.rtyva.ru", "/pdf-proxy")
        : pdfSrc;
      
      try {
        // Сначала пробуем через прокси (если это khural.rtyva.ru)
        let res;
        if (isKhuralDomain) {
          try {
            res = await fetch(proxyUrl, { 
              method: "GET", 
              mode: "cors", 
              credentials: "omit",
              headers: {
                'Accept': 'application/pdf',
              }
            });
          } catch (proxyError) {
            // Если прокси не работает, пробуем напрямую
            res = await fetch(pdfSrc, { 
              method: "GET", 
              mode: "cors", 
              credentials: "omit",
              headers: {
                'Accept': 'application/pdf',
              }
            });
          }
        } else {
          res = await fetch(pdfSrc, { 
            method: "GET", 
            mode: "cors", 
            credentials: "omit",
            headers: {
              'Accept': 'application/pdf',
            }
          });
        }
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (blob.type !== "application/pdf" && !pdfSrc.toLowerCase().includes(".pdf")) {
          throw new Error("Not a PDF file");
        }
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobSrc(objectUrl);
        }
      } catch (e) {
        // Если не удалось загрузить как blob (CORS блокирует),
        // используем Google Docs Viewer как fallback
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
