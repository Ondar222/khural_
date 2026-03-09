import React, { useEffect, useState } from "react";
import { DocumentsApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";

function getSlugFromPath() {
  // Сначала пробуем взять из routeParams от роутера
  if (typeof window !== "undefined" && window.__routeParams && window.__routeParams.slug) {
    return window.__routeParams.slug;
  }
  // Фоллбэк: парсим из текущего пути (pathname, не hash)
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const byudzhetIndex = parts.findIndex((p) => p === "byudzhet");
    if (byudzhetIndex !== -1 && byudzhetIndex + 1 < parts.length) {
      return parts[byudzhetIndex + 1];
    }
  }
  return "";
}

const BUDGET_TITLES = {
  "ispolnenie-2015": "Исполнение республиканского бюджета Республики Тыва за 2015 год",
  "ispolnenie-2016": "Исполнение республиканского бюджета Республики Тыва за 2016 год",
  "ispolnenie-2017": "Исполнение республиканского бюджета Республики Тыва за 2017 год",
  "ispolnenie-2018": "Исполнение республиканского бюджета Республики Тыва за 2018 год",
  "ispolnenie-2019": "Исполнение республиканского бюджета Республики Тыва за 2019 год",
  "ispolnenie-2020": "Исполнение республиканского бюджета Республики Тыва за 2020 год",
  "ispolnenie-2021": "Исполнение республиканского бюджета Республики Тыва за 2021 год",
  "ispolnenie-2022": "Исполнение республиканского бюджета Республики Тыва за 2022 год",
  "ispolnenie-2023": "Исполнение республиканского бюджета Республики Тыва за 2023 год",
  "ispolnenie-2024": "Исполнение республиканского бюджета Республики Тыва за 2024 год",
  "summ-2015": "Общая сумма бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) РТ за 2015 год",
  "summ-2016": "Общая сумма бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2016 год",
  "proekt-2017": "Проект республиканского бюджета на 2017 год и на плановый период 2018 и 2019 годов",
  "proekt-2018": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2018 год и на плановый период 2019 и 2020 годов\"",
  "proekt-2019": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2019 год и на плановый период 2020 и 2021 годов\"",
  "proekt-2020": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2020 год и на плановый период 2021 и 2022 годов\"",
  "proekt-2021": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на плановый период 2021-2023 годов\"",
  "proekt-2022": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2022 год и на плановый период 2023 и 2024 годов\"",
  "proekt-2023": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2023 год и на плановый период 2024 и 2025 годов\"",
  "proekt-2024": "Проект закона Республики Тыва \"О республиканском бюджете Республики Тыва на 2024 год и на плановый период 2025 и 2026 годов\"",
  "proekt-2025": "Проект закона Республики Тыва «О республиканском бюджете Республики Тыва на 2025 год и на плановый период 2026 и 2027 годов»",
  "proekt-2026": "Проект закона Республики Тыва «О республиканском бюджете Республики Тыва на 2026 год и на плановый период 2027 и 2028 годов»",
  "otchety": "Отчеты об исполнении республиканского бюджета Республики Тыва",
};

export default function BudgetDynamicPage() {
  const { lang, t } = useI18n();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageSlug, setPageSlug] = useState("");
  const [slug, setSlug] = useState(getSlugFromPath());

  useEffect(() => {
    const update = () => setSlug(getSlugFromPath());
    window.addEventListener("popstate", update);
    window.addEventListener("app:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("app:navigate", update);
    };
  }, []);

  useEffect(() => {
    if (slug) {
      const fullSlug = `info/finansy/byudzhet/${slug}`;
      setPageSlug(fullSlug);
    }
  }, [slug]);

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

    if (pageSlug) {
      loadDocuments();
    }
    return () => { alive = false; };
  }, [pageSlug]);

  const pageTitle = BUDGET_TITLES[slug] || "Бюджет";

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: 24 }}>
              <a href="/info/finansy/byudzhet" style={{ color: "#003366", textDecoration: "none" }}>
                ← Назад к бюджету
              </a>
            </div>

            <div className="card" style={{ padding: 20 }}>
              <h1 style={{ margin: "0 0 24px 0", fontSize: 24, fontWeight: 700 }}>{pageTitle}</h1>

              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  Загрузка документов...
                </div>
              ) : documents.length > 0 ? (
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
              ) : (
                <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                  Документы пока не добавлены
                </div>
              )}
            </div>
          </div>
          <SideNav title="Финансы" loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
