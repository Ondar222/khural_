import React from "react";

export default function PdfPreviewModal({ open, onClose, url, title }) {
  if (!open) return null;
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(
    url
  )}#zoom=page-width`;
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal" style={{ width: "min(1100px, 96vw)", height: "86vh" }}>
        <button className="icon-btn modal__close" aria-label="Закрыть" onClick={onClose}>
          ✕
        </button>
        <div className="modal__content" style={{ height: "calc(86vh - 48px)" }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            {title || "Предварительный просмотр"}
          </div>
          <iframe
            title="PDF preview"
            src={viewerUrl}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              width: "100%",
              height: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}
