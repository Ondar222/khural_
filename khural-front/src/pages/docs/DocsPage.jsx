import React from "react";
import SideNav from "../../components/SideNav.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { decodeHtmlEntities } from "../../utils/html.js";
import { getDocumentLinkedEntities } from "../../utils/documentMentions.js";
import { Pagination } from "antd";

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
  const { documents, deputies, committees, convocations } = useData();
  const { route } = useHashRoute();
  const [docs, setDocs] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [filterEntity, setFilterEntity] = React.useState(null); // { type: 'deputy'|'committee'|'convocation', id }
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  const slug = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    const parts = base.split("/").filter(Boolean); // ["docs", "<slug>"]
    return parts[1] || "laws";
  }, [route]);

  const cat = CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[0];

  // Reset page when query or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [query, filterEntity, slug]);

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

  const docLinkedMap = React.useMemo(() => {
    const map = new Map();
    for (const d of docs) {
      const text = (d.title || "") + " " + (d.desc || "");
      const linked = getDocumentLinkedEntities(text, { deputies, committees, convocations });
      map.set(d.id ?? d.url, linked);
    }
    return map;
  }, [docs, deputies, committees, convocations]);

  const visibleDocs = React.useMemo(() => {
    let list = docs;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const title = String(d?.title || "").toLowerCase();
        const desc = String(d?.desc || "").toLowerCase();
        const number = String(d?.number || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || number.includes(q);
      });
    }
    if (filterEntity) {
      const { type, id } = filterEntity;
      list = list.filter((d) => {
        const key = d.id ?? d.url;
        const linked = docLinkedMap.get(key);
        if (!linked) return false;
        if (type === "deputy") return linked.deputies.some((x) => String(x.id) === String(id));
        if (type === "committee") return linked.committees.some((x) => String(x.id) === String(id));
        if (type === "convocation") return linked.convocations.some((x) => String(x.id) === String(id));
        return false;
      });
    }
    return list;
  }, [docs, query, filterEntity, docLinkedMap]);

  const totalPages = Math.ceil(visibleDocs.length / PAGE_SIZE);
  const paginatedDocs = visibleDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <div className="docs-filter-wrap" style={{ marginBottom: 16 }}>
              {/* <label style={{ marginRight: 8, fontSize: 14, color: "#374151" }}>Связано с:</label>
              <select
                value={filterEntity ? `${filterEntity.type}:${filterEntity.id}` : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setFilterEntity(null);
                    return;
                  }
                  const [type, id] = v.split(":");
                  setFilterEntity({ type, id });
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #dfe3eb",
                  fontSize: 14,
                  minWidth: 220,
                }}
                aria-label="Фильтр по депутату, комитету или созыву"
              >
                <option value="">Все документы</option>
                <optgroup label="Депутаты">
                  {(Array.isArray(deputies) ? deputies : []).slice(0, 100).map((p) => (
                    <option key={`deputy-${p.id}`} value={`deputy:${p.id}`}>
                      {p.fullName || p.name || p.id}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Комитеты">
                  {(Array.isArray(committees) ? committees : []).map((c) => (
                    <option key={`committee-${c.id}`} value={`committee:${c.id}`}>
                      {c.title || c.name || c.id}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Созывы">
                  {(Array.isArray(convocations) ? convocations : []).map((c) => {
                    const id = c && typeof c === "object" ? c.id : c;
                    const label = c && typeof c === "object" ? (c.name || c.number || c.id) : String(c ?? "");
                    return (
                      <option key={`conv-${id}`} value={`convocation:${id}`}>
                        {label || `Созыв ${id}`}
                      </option>
                    );
                  })}
                </optgroup>
              </select> */}
            </div>
            <div className="law-list docs-page__list">
              {paginatedDocs.map((d) => {
                const key = d.id ?? d.url;
                const linked = docLinkedMap.get(key) || { deputies: [], committees: [], convocations: [] };
                const hasLinked = linked.deputies.length > 0 || linked.committees.length > 0 || linked.convocations.length > 0;
                return (
                  <div key={key} className="law-item card">
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
                        {hasLinked && (
                          <div className="law-linked" style={{ marginTop: 10, fontSize: 12, display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center" }}>
                            <span style={{ color: "#6b7280" }}>Связано:</span>
                            {linked.deputies.map((x) => (
                              <span key={`d-${x.id}`} style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 6 }} title="Депутат">👤 {x.label}</span>
                            ))}
                            {linked.committees.map((x) => (
                              <span key={`c-${x.id}`} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 6 }} title="Комитет">📋 {x.label}</span>
                            ))}
                            {linked.convocations.map((x) => (
                              <span key={`v-${x.id}`} style={{ background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: 6 }} title="Созыв">📅 {x.label}</span>
                            ))}
                          </div>
                        )}
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
                );
              })}
            </div>
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <Pagination
                  current={page}
                  onChange={setPage}
                  total={visibleDocs.length}
                  pageSize={PAGE_SIZE}
                  showSizeChanger={false}
                  showTotal={(total) => `Всего: ${total}`}
                />
              </div>
            )}
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
