import React from "react";
import SideNav from "../../components/SideNav.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { decodeHtmlEntities } from "../../utils/html.js";

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

const CATEGORIES = [
  {
    slug: "laws",
    title: "Законы Республики Тыва",
    backendType: "law",
  },
  {
    slug: "resolutions",
    title: "Постановления ВХ РТ",
    backendType: "resolution",
  },
  {
    slug: "initiatives",
    title: "Законодательные инициативы",
    backendType: "order",
  },
  {
    slug: "civic",
    title: "Законодательная инициатива гражданами",
    backendType: "other",
  },
  {
    slug: "constitution",
    title: "Реализация принятых поправок в Конституцию РФ",
    backendType: "other",
  },
  { 
    slug: "bills", 
    title: "Законопроекты",
    backendType: "decision",
  },
];

export default function DocsPage() {
  const { documents } = useData();
  const { route } = useHashRoute();
  const [docs, setDocs] = React.useState([]);
  const [query, setQuery] = React.useState("");

  const slug = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    const parts = base.split("/").filter(Boolean); // ["docs", "<slug>"]
    return parts[1] || "laws";
  }, [route]);

  const cat = CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[0];

  React.useEffect(() => {
    // Фильтруем документы по типу из бекенда
    const fromApi = (documents || []).filter((d) => {
      // Маппинг типов фронтенда на типы бекенда
      const typeMap = {
        laws: "laws",
        resolutions: "resolutions",
        bills: "bills",
        initiatives: "initiatives",
        civic: "other",
        constitution: "other",
      };
      
      const expectedType = typeMap[slug] || slug;
      
      // Для constitution и civic оба используют тип "other" в бекенде
      // Различаем их по category или metadata
      const catStr =
        typeof d?.category === "string"
          ? d.category
          : d?.category?.name || d?.category?.title || "";
      const titleStr = typeof d?.title === "string" ? d.title : String(d?.title || "");

      if (slug === "constitution") {
        const lowerCat = catStr.toLowerCase();
        const lowerTitle = titleStr.toLowerCase();
        return d?.type === "other" && (lowerCat.includes("конституция") || lowerCat.includes("constitution") || lowerTitle.includes("конституция"));
      }
      if (slug === "civic") {
        const lowerCat = catStr.toLowerCase();
        const lowerTitle = titleStr.toLowerCase();
        return d?.type === "other" && (lowerCat.includes("гражданами") || lowerCat.includes("civic") || lowerTitle.includes("гражданами"));
      }
      
      return d?.type === expectedType;
    });
    
    setDocs(
      fromApi.map((d) => ({
        id: d.id,
        title: typeof d.title === "string" ? d.title : d?.title?.name || d?.title?.title || String(d.title || ""),
        desc: (() => {
          const raw = d.desc || d.description || "";
          if (typeof raw === "string") return raw;
          if (Array.isArray(raw)) return raw.join(" ");
          return raw ? String(raw) : "";
        })(),
        number: typeof d.number === "string" ? d.number : d.number ? String(d.number) : "",
        url: normalizeFilesUrl(typeof d.url === "string" ? d.url : d.url ? String(d.url) : ""),
      }))
    );
  }, [documents, slug]);

  const visibleDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => {
      const title = String(d?.title || "").toLowerCase();
      const desc = String(d?.desc || "").toLowerCase();
      const number = String(d?.number || "").toLowerCase();
      return title.includes(q) || desc.includes(q) || number.includes(q);
    });
  }, [docs, query]);

  return (
    <section className="section section--docs">
      <div className="container">
        <div className="page-grid">
          <div className="docs-page__main">
            <h1 className="docs-page__title">{cat.title}</h1>
            <div className="docs-search-wrap">
              <input
                type="text"
                placeholder="Поиск по названию, номеру, описанию"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #dfe3eb",
                  background: "#fff",
                  color: "#111827",
                  fontSize: 14,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#003366";
                  e.target.style.boxShadow = "0 10px 24px rgba(0,0,0,0.08)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#dfe3eb";
                  e.target.style.boxShadow = "0 6px 18px rgba(0,0,0,0.04)";
                }}
                aria-label="Поиск документов"
              />
            </div>
            <div className="law-list docs-page__list">
              {visibleDocs.map((d) => (
                  <div key={d.id || d.url} className="law-item card">
                  <div className="law-left">
                    <div className="law-ico">📄</div>
                    <div>
                      <div className="law-title">{d.title}</div>
                      {d.desc ? (
                        (() => {
                          const decoded = decodeHtmlEntities(d.desc);
                          if (!decoded) return null;
                          return looksLikeHtml(decoded) ? (
                            <div className="law-desc" dangerouslySetInnerHTML={{ __html: String(decoded) }} />
                          ) : (
                            <div className="law-desc">{decoded}</div>
                          );
                        })()
                      ) : null}
                      {d.number && <div className="law-status">№ {d.number}</div>}
                    </div>
                  </div>
                  <a
                    className="btn btn--primary"
                    href={d.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={d.url ? true : undefined}
                  >
                    Открыть
                  </a>
                </div>
              ))}
            </div>
          </div>
          <SideNav
            title="Документы"
            links={[
              { label: "Законы Республики Тыва", href: "/docs/laws" },
              { label: "Постановления ВХ РТ", href: "/docs/resolutions" },
              {
                label: "Законодательные инициативы",
                href: "/docs/initiatives",
              },
              {
                label: "Законодательная инициатива гражданами",
                href: "/docs/civic",
              },
              {
                label: "Реализация поправок в Конституцию РФ",
                href: "/docs/constitution",
              },
              { label: "Законопроекты", href: "/docs/bills" },
            ]}
          />
        </div>
      </div>
      <ScrollToTop />
    </section>
  );
}
