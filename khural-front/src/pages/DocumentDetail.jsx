import React from "react";
import { useHashRoute } from "../Router.jsx";
import { DocumentsApi } from "../api/client.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { decodeHtmlEntities } from "../utils/html.js";
import DataState from "../components/DataState.jsx";
import { useI18n } from "../context/I18nContext.jsx";

function looksLikePdf(url) {
  const u = String(url || "").toLowerCase();
  return u.includes(".pdf");
}

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

function renderDocDesc(raw) {
  const decoded = decodeHtmlEntities(raw);
  if (!decoded) return null;
  return looksLikeHtml(decoded) ? (
    <div className="law-desc" dangerouslySetInnerHTML={{ __html: String(decoded) }} />
  ) : (
    <div className="law-desc">{decoded}</div>
  );
}

export default function DocumentDetail() {
  const { route, navigate } = useHashRoute();
  const { lang } = useI18n();
  const docId = route.params?.id;
  const [doc, setDoc] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [pdfPage, setPdfPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(null); // null means unknown
  const [pdfSrc, setPdfSrc] = React.useState("");
  const [blobSrc, setBlobSrc] = React.useState("");
  const [pdfLoading, setPdfLoading] = React.useState(false);
  const [pdfError, setPdfError] = React.useState("");

  // Load document
  React.useEffect(() => {
    if (!docId) {
      setError("ID документа не указан");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await DocumentsApi.getById(docId);
        if (!cancelled) {
          setDoc(data);
          // Determine PDF URL
          const pdfUrl = normalizeFilesUrl(
            data?.pdfFile?.link ||
              data?.url ||
              data?.file?.link ||
              data?.metadata?.pdfFileTyLink ||
              ""
          );
          if (pdfUrl && looksLikePdf(pdfUrl)) {
            setPdfSrc(pdfUrl);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Не удалось загрузить документ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [docId]);

  // Load PDF as blob for pagination
  React.useEffect(() => {
    if (!pdfSrc) {
      setBlobSrc("");
      setTotalPages(null);
      return;
    }

    let cancelled = false;
    let objectUrl = "";

    (async () => {
      setPdfLoading(true);
      setPdfError("");
      setBlobSrc("");
      try {
        const res = await fetch(pdfSrc, { method: "GET", mode: "cors", credentials: "omit" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) {
          setBlobSrc(objectUrl);
          // Page count is optional - PDF navigation via #page=N works without it
          setTotalPages(null);
        }
      } catch (e) {
        if (!cancelled) {
          setPdfError("Не удалось загрузить PDF для просмотра");
        }
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfSrc]);

  // Update page in PDF viewer
  const handlePageChange = React.useCallback((newPage) => {
    const page = Math.max(1, newPage);
    if (totalPages !== null && page > totalPages) {
      setPdfPage(totalPages);
    } else {
      setPdfPage(page);
    }
  }, [totalPages]);

  // Get description based on language
  const description = React.useMemo(() => {
    if (!doc) return null;
    if (lang === "ty") {
      return doc.descriptionTy || doc.metadata?.descriptionTy || doc.desc || doc.description;
    }
    return doc.descriptionRu || doc.description || doc.desc || doc.metadata?.descriptionRu;
  }, [doc, lang]);

  // SEO: Update document title and meta tags
  React.useEffect(() => {
    if (!doc) return;
    const title = doc.title || "Документ";
    document.title = `${title} | Верховный Хурал РТ`;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description || doc.title || "");
    }

    // Update meta keywords
    const keywords = [
      doc.title,
      doc.number,
      doc.category?.name,
      ...(doc.metadata?.keywords || []),
    ]
      .filter(Boolean)
      .join(", ");
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute("content", keywords);
    }

    // Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", description || title);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", window.location.href);
  }, [doc, description]);

  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <DataState loading={true} />
        </div>
      </section>
    );
  }

  if (error || !doc) {
    return (
      <section className="section">
        <div className="container">
          <DataState error={error || "Документ не найден"} onRetry={() => window.location.reload()} />
        </div>
      </section>
    );
  }

  const pdfUrl = normalizeFilesUrl(
    doc?.pdfFile?.link ||
      doc?.url ||
      doc?.file?.link ||
      doc?.metadata?.pdfFileTyLink ||
      ""
  );
  const isPdf = looksLikePdf(pdfUrl);

  return (
    <section className="section">
      <div className="container">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => navigate("/documents")}
              style={{
                background: "none",
                border: "none",
                color: "#3b82f6",
                cursor: "pointer",
                fontSize: 14,
                marginBottom: 12,
                padding: 0,
              }}
            >
              ← Назад к списку документов
            </button>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{doc.title}</h1>
            <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              {doc.number ? `${doc.number} • ` : ""}
              {doc.publishedAt || doc.date || doc.createdAt || ""}
              {doc.category?.name ? ` • ${doc.category.name}` : ""}
            </div>
          </div>

          {/* Description */}
          {description && (
            <div style={{ marginBottom: 32, padding: 20, background: "#f9fafb", borderRadius: 8 }}>
              {renderDocDesc(description)}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="btn btn--primary"
                style={{ textDecoration: "none" }}
              >
                📥 Скачать документ
              </a>
            )}
            {isPdf && pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{ textDecoration: "none" }}
              >
                Открыть в новой вкладке ↗
              </a>
            )}
          </div>

          {/* PDF Viewer with Pagination */}
          {isPdf && pdfUrl && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  background: "#fff",
                }}
              >
                {/* Pagination Controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handlePageChange(pdfPage - 1)}
                    disabled={pdfPage <= 1}
                    style={{ minWidth: 80 }}
                  >
                    ← Назад
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, color: "#6b7280" }}>Страница</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages || undefined}
                      value={pdfPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) handlePageChange(val);
                      }}
                      style={{
                        width: 60,
                        padding: "4px 8px",
                        border: "1px solid #d1d5db",
                        borderRadius: 4,
                        textAlign: "center",
                      }}
                    />
                    {totalPages !== null ? (
                      <span style={{ fontSize: 14, color: "#6b7280" }}>из {totalPages}</span>
                    ) : (
                      <span style={{ fontSize: 14, color: "#6b7280" }}>(введите номер)</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => handlePageChange(pdfPage + 1)}
                    disabled={totalPages !== null && pdfPage >= totalPages}
                    style={{ minWidth: 80 }}
                  >
                    Вперёд →
                  </button>
                </div>

                {/* PDF Viewer */}
                <div style={{ minHeight: 600, position: "relative" }}>
                  {pdfLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                      Загрузка документа…
                    </div>
                  ) : pdfError ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#b91c1c" }}>
                      {pdfError}
                      <div style={{ marginTop: 12 }}>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn">
                          Открыть в новой вкладке
                        </a>
                      </div>
                    </div>
                  ) : blobSrc ? (
                    <iframe
                      key={`${blobSrc}#page=${pdfPage}`}
                      title="PDF preview"
                      src={`${blobSrc}#page=${pdfPage}`}
                      style={{
                        border: "none",
                        width: "100%",
                        height: "800px",
                        minHeight: 600,
                      }}
                    />
                  ) : (
                    <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                      Документ недоступен для предпросмотра
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback for non-PDF or if PDF viewer fails */}
          {!isPdf && pdfUrl && (
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 20,
                  background: "#f9fafb",
                  textAlign: "center",
                }}
              >
                <p style={{ marginBottom: 16 }}>Документ доступен для скачивания</p>
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
                  Открыть документ
                </a>
              </div>
            </div>
          )}

          {/* Metadata */}
          {doc.metadata && Object.keys(doc.metadata).length > 0 && (
            <div style={{ marginTop: 32, padding: 20, background: "#f9fafb", borderRadius: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Дополнительная информация</h3>
              {doc.metadata.author && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Автор:</strong> {doc.metadata.author}
                </div>
              )}
              {doc.metadata.department && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Ведомство:</strong> {doc.metadata.department}
                </div>
              )}
              {doc.metadata.keywords && Array.isArray(doc.metadata.keywords) && doc.metadata.keywords.length > 0 && (
                <div>
                  <strong>Ключевые слова:</strong> {doc.metadata.keywords.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

