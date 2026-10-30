import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import ScrollToTop from "../../components/ScrollToTop.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";
import { DocumentsApi } from "../../api/client.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { decodeHtmlEntities } from "../../utils/html.js";
import { isDocumentFileUrl } from "../../utils/documentFile.js";
import { getDocumentLinkedEntities } from "../../utils/documentMentions.js";
import PdfPreviewModal from "../../components/PdfPreviewModal.jsx";
import DocumentActions from "../../components/DocumentActions.jsx";
import { Pagination } from "antd";
import { DocumentIcon, UserIcon, ClipboardIcon, CalendarIcon } from "../../components/icons/LinearIcons.jsx";

function looksLikeHtml(s) {
  return /<\/?[a-z][\s\S]*>/i.test(String(s || ""));
}

function formatDocumentDate(value) {
  if (!value) return "";
  const date = String(value).trim();
  const isoDate = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}.${isoDate[2]}.${isoDate[1]}`;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(date)) return date;

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("ru-RU");
}

function matchesSearchPrefix(value, query) {
  const text = String(value || "").toLocaleLowerCase("ru-RU");
  return text.startsWith(query) || text.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(query));
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

// Статические файлы — только эти разделы их используют (для остальных API отдаёт всё)
const STATIC_MERGE_SLUGS = ["initiatives", "civic", "constitution", "bills", "resolutions"];
const STATIC_FILE_MAP = {
  laws: "/data/docs_laws.json",
  resolutions: "/data/docs_resolutions.json",
  initiatives: "/data/docs_initiatives.json",
  civic: "/data/docs_civic.json",
  constitution: "/data/docs_constitution.json",
  bills: "/data/docs_bills.json",
};

// Приводит документ из ответа API к модели отображения
function mapApiRow(d) {
  const cat =
    typeof d.category === "string"
      ? d.category
      : d.category?.name || d.category?.title || "";
  const fileUrl = d.pdfFile?.link || d.previewUrl || "";
  return {
    id: d.id,
    title: typeof d.title === "string" ? d.title : d?.title?.name || d?.title?.title || String(d.title || ""),
    desc: String(d.content || d.desc || "").trim(),
    number: d.number ? String(d.number) : "",
    date: d.publishedAt || d.date || d.createdAt || "",
    url: normalizeFilesUrl(fileUrl || d.url || ""),
    category: cat || "federal",
    type: d.type,
  };
}

export default function DocsPage() {
  const { t } = useI18n();
  const { deputies, committees, convocations, documents: allDocuments, ensureDocuments, loading } = useData();
  const { route } = useHashRoute();
  const [query, setQuery] = React.useState("");
  const [filterEntity, setFilterEntity] = React.useState(null); // { type: 'deputy'|'committee'|'convocation', id }
  const [page, setPage] = React.useState(1);
  const [subCategory, setSubCategory] = React.useState("all"); // Для раздела constitution: 'all', 'federal', 'regional'
  const [preview, setPreview] = React.useState(null); // { url, title } — модальный предпросмотр документа
  const PAGE_SIZE = 10;

  const slug = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    const parts = base.split("/").filter(Boolean); // ["docs", "<slug>"]
    return parts[1] || "laws";
  }, [route]);

  const cat = CATEGORIES.find((c) => c.slug === slug) || CATEGORIES[0];

  const searchQuery = query.trim();

  React.useEffect(() => {
    if (searchQuery && !allDocuments.length) ensureDocuments();
  }, [searchQuery, allDocuments.length, ensureDocuments]);

  // Reset page and subcategory when slug changes
  React.useEffect(() => {
    setPage(1);
    setSubCategory("all");
  }, [slug]);

  // Reset page when query or filter changes
  React.useEffect(() => {
    setPage(1);
  }, [query, filterEntity, subCategory, slug]);

  // Auto scroll to top when page changes
  React.useEffect(() => {
    if (page > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  // ── Загрузка API постранично ──────────────────────────────────────────────
  const [apiItems, setApiItems] = React.useState([]);
  const [apiTotal, setApiTotal] = React.useState(0);
  const [apiLoading, setApiLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    if (searchQuery) {
      setApiLoading(false);
      return () => {
        alive = false;
      };
    }
    setApiLoading(true);
    DocumentsApi.listPublished({
      page,
      limit: PAGE_SIZE,
      type: cat.backendType,
    })
      .then((res) => {
        if (!alive) return;
        setApiItems(res?.items || []);
        setApiTotal(res?.total || 0);
      })
      .catch(() => {
        if (!alive) return;
        setApiItems([]);
        setApiTotal(0);
      })
      .finally(() => {
        if (alive) setApiLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, cat.backendType, searchQuery]);

  // ── Загрузка статических файлов ───────────────────────────────────────────
  const [staticFileDocs, setStaticFileDocs] = React.useState([]);
  React.useEffect(() => {
    setStaticFileDocs([]);
    const file = STATIC_FILE_MAP[slug];
    if (!file) return undefined;
    let alive = true;
    (async () => {
      try {
        const response = await fetch(file, { cache: "no-cache" });
        if (!response.ok) return;
        const data = await response.json();
        if (alive && Array.isArray(data)) setStaticFileDocs(data);
      } catch (e) {
        if (import.meta.env.DEV) console.warn(`Failed to load static docs from ${file}:`, e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  // ── Статические документы раздела (с локальным поиском и подкатегорией) ────
  const staticMapped = React.useMemo(() => {
    if (!STATIC_MERGE_SLUGS.includes(slug)) return [];
    let list = (staticFileDocs || []).map((d) => ({
      id: d.id,
      title: typeof d.title === "string" ? d.title : d?.title?.name || d?.title?.title || String(d.title || ""),
      desc: (() => {
        const raw = d.desc || d.description || "";
        if (typeof raw === "string") return raw;
        if (Array.isArray(raw)) return raw.join(" ");
        return raw ? String(raw) : "";
      })(),
      number: typeof d.number === "string" ? d.number : d.number ? String(d.number) : "",
      date: d.publishedAt || d.date || d.createdAt || "",
      url: normalizeFilesUrl(typeof d.url === "string" ? d.url : d.url ? String(d.url) : ""),
      category: d.category || "federal",
    }));
    // Поиск по статическим документам (API-документы фильтруются на сервере)
    const q = searchQuery.toLowerCase();
    if (q) {
      list = list.filter((d) =>
        [d.title, d.desc, d.number].some((s) => String(s || "").toLowerCase().includes(q))
      );
    }
    // Подкатегория для constitution (federal/regional)
    if (slug === "constitution" && subCategory !== "all") {
      list = list.filter((d) => d.category === subCategory);
    }
    return list;
  }, [staticFileDocs, slug, subCategory, searchQuery]);

  const searchDocuments = React.useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLocaleLowerCase("ru-RU");
    let searchedApi = (allDocuments || [])
      .filter((d) => d.type === cat.backendType)
      .map(mapApiRow)
      .filter((d) => [d.title, d.number, d.desc].some((value) => matchesSearchPrefix(value, query)));

    if (slug === "constitution") {
      searchedApi = searchedApi.filter((d) => {
        const text = `${d.category} ${d.title}`.toLowerCase();
        return text.includes("конституц") || text.includes("constitution");
      });
    }
    if (slug === "civic") {
      searchedApi = searchedApi.filter((d) => {
        const text = `${d.category} ${d.title}`.toLowerCase();
        return text.includes("гражданами") || text.includes("civic");
      });
    }

    const apiIds = new Set(searchedApi.map((d) => String(d.id)));
    return STATIC_MERGE_SLUGS.includes(slug)
      ? [...staticMapped.filter((d) => !apiIds.has(String(d.id))), ...searchedApi]
      : searchedApi;
  }, [allDocuments, cat.backendType, searchQuery, slug, staticMapped]);

  // ── Объединение API + статических документов ──────────────────────────────
  // apiItems — уже одна страница с сервера.
  // Если API по типу ничего не вернул (разделы полностью статические) —
  // статические документы пагинуются на клиенте.
  const docs = React.useMemo(() => {
    if (searchQuery) {
      const start = (page - 1) * PAGE_SIZE;
      return searchDocuments.slice(start, start + PAGE_SIZE);
    }

    let apiMapped = apiItems.map(mapApiRow);

    // Для constitution и civic в бэкенде общий тип "other" —
    // различаем их по category/title (как в прежней фильтрации)
    if (slug === "constitution") {
      apiMapped = apiMapped.filter((d) => {
        const s = `${d.category} ${d.title}`.toLowerCase();
        return s.includes("конституц") || s.includes("constitution");
      });
    }
    if (slug === "civic") {
      apiMapped = apiMapped.filter((d) => {
        const s = `${d.category} ${d.title}`.toLowerCase();
        return s.includes("гражданами") || s.includes("civic");
      });
    }

    if (!STATIC_MERGE_SLUGS.includes(slug)) return apiMapped;

    if (apiTotal === 0) {
      const start = (page - 1) * PAGE_SIZE;
      return staticMapped.slice(start, start + PAGE_SIZE);
    }
    if (page !== 1) return apiMapped;

    // page === 1: статические документы в начале, без дубликатов по ID
    const apiIds = new Set(apiMapped.map((d) => String(d.id)));
    return [...staticMapped.filter((d) => !apiIds.has(String(d.id))), ...apiMapped];
  }, [apiItems, apiTotal, slug, page, staticMapped, searchQuery, searchDocuments]);

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
  }, [docs, filterEntity, docLinkedMap]);

  // Серверная пагинация: общее число страниц из apiTotal + статические
  const staticCount = staticMapped.length;
  const searchTotal = searchQuery ? searchDocuments.length : apiTotal + staticCount;
  const totalPages = Math.ceil(searchTotal / PAGE_SIZE);
  const paginatedDocs = visibleDocs;

  // Loading indicator for API fetch
  const showApiLoading = (apiLoading || (searchQuery && loading.documents)) && paginatedDocs.length === 0;

  return (
    <section className="section section--docs">
      <div className="container">
        <div className="page-grid">
          <div className="docs-page__main">
            <h1 className="docs-page__title">{t(cat.title) || cat.title}</h1>
            
            {/* Подкатегории для раздела Конституции */}
            {slug === "constitution" && (
              <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setSubCategory("all")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: subCategory === "all" ? "2px solid #003366" : "1px solid #dfe3eb",
                    background: subCategory === "all" ? "#003366" : "#fff",
                    color: subCategory === "all" ? "#fff" : "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Все документы
                </button>
                <button
                  type="button"
                  onClick={() => setSubCategory("federal")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: subCategory === "federal" ? "2px solid #003366" : "1px solid #dfe3eb",
                    background: subCategory === "federal" ? "#003366" : "#fff",
                    color: subCategory === "federal" ? "#fff" : "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Федеральное законодательство
                </button>
                <button
                  type="button"
                  onClick={() => setSubCategory("regional")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: subCategory === "regional" ? "2px solid #003366" : "1px solid #dfe3eb",
                    background: subCategory === "regional" ? "#003366" : "#fff",
                    color: subCategory === "regional" ? "#fff" : "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  Региональное законодательство
                </button>
              </div>
            )}
            
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
                      <div className="law-ico"><DocumentIcon size={20} /></div>
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
                        {d.date && (
                          <div className="law-status">Дата: {formatDocumentDate(d.date)}</div>
                        )}
                        {hasLinked && (
                          <div className="law-linked" style={{ marginTop: 10, fontSize: 12, display: "flex", flexWrap: "wrap", gap: "6px 12px", alignItems: "center" }}>
                            <span style={{ color: "#6b7280" }}>Связано:</span>
                            {linked.deputies.map((x) => (
                              <span key={`d-${x.id}`} style={{ background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }} title="Депутат"><UserIcon size={12} /> {x.label}</span>
                            ))}
                            {linked.committees.map((x) => (
                              <span key={`c-${x.id}`} style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }} title="Комитет"><ClipboardIcon size={12} /> {x.label}</span>
                            ))}
                            {linked.convocations.map((x) => (
                              <span key={`v-${x.id}`} style={{ background: "#e0e7ff", color: "#3730a3", padding: "2px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 4 }} title="Созыв"><CalendarIcon size={12} /> {x.label}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="law-actions">
                      <DocumentActions
                        url={d.url}
                        title={d.title}
                        onPreview={isDocumentFileUrl(d.url) ? () => setPreview({ url: d.url, title: d.title }) : undefined}
                        noFileLabel="Открыть"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {showApiLoading ? (
              <div style={{ padding: "12px 4px", color: "#6b7280" }}>Загрузка документов…</div>
            ) : null}
            {searchQuery && !loading.documents && paginatedDocs.length === 0 ? (
              <div style={{ padding: "12px 4px", color: "#6b7280" }}>Документы не найдены.</div>
            ) : null}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <Pagination
                  current={page}
                  onChange={setPage}
                  total={searchTotal}
                  pageSize={PAGE_SIZE}
                  showSizeChanger={false}
                  showTotal={(total) => `Всего: ${total}`}
                />
              </div>
            )}
          </div>
          <SideNav
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
      <PdfPreviewModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        url={preview?.url}
        title={preview?.title}
      />
    </section>
  );
}
