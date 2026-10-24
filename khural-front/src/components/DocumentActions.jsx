import React from "react";
import {
  DOC_FILE_MISSING_HINT,
  downloadName,
  isDocumentFileUrl,
} from "../utils/documentFile.js";

// Минималистичные линейные SVG-иконки (stroke = currentColor, наследуют цвет кнопки)
function EyeIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M1 12s4-7.5 11-7.5S23 12 23 12s-4 7.5-11 7.5S1 12 1 12z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// Единый размер обоих кнопок, чтобы они стояли ровно в ряд
const btnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  height: 38,
  padding: "0 15px",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  borderRadius: 8,
  whiteSpace: "nowrap",
  textDecoration: "none",
  boxSizing: "border-box",
  cursor: "pointer",
};

/**
 * Пара кнопок для документа: «Открыть» (предпросмотр на сайте) и «Скачать».
 * Кнопки НЕ скрываются — если файла нет, показываем неактивную «Скачать»
 * и «Открыть» на страницу (href) или неактивную кнопку.
 */
export default function DocumentActions({
  url,
  title,
  onPreview,
  openInNewTab = false,
  openLabel = "Открыть",
  href = "",
  missingHint = DOC_FILE_MISSING_HINT,
  noFileLabel = "Смотреть",
}) {
  const fileUrl = isDocumentFileUrl(url) ? String(url) : "";
  const pageHref = !fileUrl && href ? String(href) : "";
  const hasAny = fileUrl || pageHref;

  // Кнопка «Открыть / Смотреть»
  let openButton;
  if (fileUrl) {
    openButton = onPreview ? (
      <button
        type="button"
        className="btn btn--primary"
        onClick={onPreview}
        style={{ ...btnBase, textDecoration: "none" }}
      >
        <EyeIcon />
        {openLabel}
      </button>
    ) : (
      <a
        className="btn btn--primary"
        href={fileUrl}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        style={btnBase}
      >
        <EyeIcon />
        {openLabel}
      </a>
    );
  } else if (pageHref) {
    openButton = (
      <a className="btn btn--primary" href={pageHref} style={btnBase}>
        <EyeIcon />
        {openLabel}
      </a>
    );
  } else {
    // Нет файла и нет href — показываем неактивную кнопку «Смотреть»
    openButton = (
      <button
        type="button"
        className="btn btn--primary"
        disabled
        aria-disabled="true"
        title={missingHint}
        style={{ ...btnBase, opacity: 0.5, cursor: "not-allowed" }}
      >
        <EyeIcon />
        {noFileLabel}
      </button>
    );
  }

  // Кнопка «Скачать»
  const downloadButton = fileUrl ? (
    <a
      className="btn"
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={downloadName(title, fileUrl)}
      title="Скачать документ"
      aria-label={`Скачать: ${title || "документ"}`}
      style={btnBase}
    >
      <DownloadIcon />
      Скачать
    </a>
  ) : (
    <button
      type="button"
      className="btn"
      disabled
      aria-disabled="true"
      title={missingHint}
      style={{ ...btnBase, opacity: 0.5, cursor: "not-allowed" }}
    >
      <DownloadIcon />
      Скачать
    </button>
  );

  return (
    <>
      {openButton}
      {downloadButton}
    </>
  );
}
