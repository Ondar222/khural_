import React, { useEffect, useState } from "react";
import { DocumentsApi } from "../api/client.js";

export default function BudgetDocumentsList({ pageSlug }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    
    const loadDocuments = async () => {
      setLoading(true);
      try {
        const docs = await DocumentsApi.listAll();
        const pageDocs = (Array.isArray(docs) ? docs : []).filter(
          (d) => d.page_slug === pageSlug
        );
        if (alive) setDocuments(pageDocs);
      } catch (e) {
        console.error("Failed to load budget documents:", e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadDocuments();
    return () => { alive = false; };
  }, [pageSlug]);

  if (loading) {
    return <div style={{ padding: 20, textAlign: "center", color: "#666" }}>Загрузка документов...</div>;
  }

  if (!documents.length) {
    return <div style={{ padding: 20, color: "#666" }}>Документы пока не добавлены</div>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            padding: 16,
            background: "#fff",
            border: "1px solid #dfe3eb",
            borderRadius: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 24 }}>📄</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, color: "#111827" }}>
                <a
                  href={doc.file_url || doc.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#003366", textDecoration: "underline" }}
                >
                  {doc.title || "Документ"}
                </a>
              </div>
              {doc.description && (
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                  {doc.description}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
