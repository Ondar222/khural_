import React from "react";

function normalizeUrl(url) {
  if (!url) return "";
  try {
    const absolute = new URL(url, window.location.origin).toString();
    return encodeURI(absolute);
  } catch {
    return encodeURI(String(url));
  }
}

export default function PdfPreviewModal({ open, onClose, url, title }) {
  const pdfSrc = React.useMemo(() => normalizeUrl(url), [url]);
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
                <iframe
                  key={pdfSrc}
                  title="PDF preview"
                  src={pdfSrc}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    width: "100%",
                    height: "100%",
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: "#555" }}>
                Если документ не отображается,{" "}
                <a href={pdfSrc} target="_blank" rel="noopener noreferrer">
                  откройте в новой вкладке
                </a>
                .
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
