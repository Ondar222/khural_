import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";
import { DocumentsApi } from "../api/client.js";
import { Input, Select, Space, Switch, Pagination, Button } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { decodeHtmlEntities } from "../utils/html.js";
import { isDocumentFileUrl } from "../utils/documentFile.js";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import DocumentActions from "../components/DocumentActions.jsx";
import { DocumentIcon } from "../components/icons/LinearIcons.jsx";

const PAGE_SIZE = 10;
// Годы для фильтра: данные в API начинаются с 2015 г., берём диапазон с запасом
const YEAR_OPTIONS = (() => {
  const nowYear = new Date().getFullYear();
  const years = [];
  for (let y = nowYear + 1; y >= 2010; y -= 1) years.push(String(y));
  return ["Все", ...years];
})();

function norm(v) {
  return String(v ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
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

// Приводит документ из ответа API (/api/documents) к модели страницы
function mapApiDoc(d) {
  const categoryName =
    typeof d.category === "string" ? d.category : d.category?.name || d.category?.title || "";
  const fileUrl = d.pdfFile?.link || d.previewUrl || "";
  return {
    id: d.id,
    title: String(d.title || "").trim(),
    desc: String(d.content || "").trim(),
    date: d.publishedAt || d.createdAt || "",
    number: d.number ? String(d.number) : "",
    category: categoryName,
    categoryId: d.category?.id ?? null,
    type: d.type,
    url: fileUrl ? normalizeFilesUrl(fileUrl) : "",
  };
}

// Фильтр по дате применяется на клиенте: API не поддерживает поиск по дате
function matchDate(doc, qDate) {
  const qd = norm(qDate);
  if (!qd) return true;
  return norm(doc.date).includes(qd);
}

function DocItem({ d, onPreview }) {
  const url = d.url;
  const hasFile = isDocumentFileUrl(url);
  const detailHref = /^\d+$/.test(String(d.id)) ? `/documents/${d.id}` : "";
  return (
    <div className="law-item card">
      <div className="law-left">
        <div className="law-ico"><DocumentIcon size={20} /></div>
        <div>
          <div className="law-title">{d.title}</div>
          {renderDocDesc(d.desc)}
          <div className="card-subtitle">
            {d.number ? `${d.number} • ` : ""}
            {d.date || ""}
            {d.category ? ` • ${d.category}` : ""}
          </div>
        </div>
      </div>
      <div className="law-actions">
        <DocumentActions
          url={url}
          title={d.title}
          onPreview={hasFile ? () => onPreview({ url, title: d.title }) : undefined}
          href={detailHref}
          noFileLabel="Открыть"
        />
      </div>
    </div>
  );
}

// Один раздел (категория): свёрнут по умолчанию, документы подгружаются при раскрытии,
// внутри раздела — серверная пагинация.
function SectionBlock({ section, open, onToggleOpen, state, onRetry, onLoadPage, qDate, onPreview }) {
  const detailsRef = React.useRef(null);

  // Синхронизируем атрибут open с состоянием (React не умеет controlled <details>)
  React.useEffect(() => {
    const el = detailsRef.current;
    if (el && el.open !== open) el.open = open;
  }, [open]);

  const items = (state.items || []).filter((d) => matchDate(d, qDate));
  const totalPages = Math.ceil((state.total || 0) / PAGE_SIZE);

  return (
    <details
      ref={detailsRef}
      className="tile"
      style={{ margin: 0 }}
      onToggle={(e) => {
        const isOpen = e.currentTarget.open;
        if (isOpen !== open) onToggleOpen(section.id, isOpen);
      }}
    >
      <summary style={{ cursor: "pointer", fontWeight: 900 }}>
        {section.name}{" "}
        <span style={{ opacity: 0.7 }}>({section.total})</span>
      </summary>
      {open ? (
        <div style={{ marginTop: 10 }}>
          {state.loading && !items.length ? (
            <div style={{ padding: "12px 4px", color: "#6b7280" }}>Загрузка документов…</div>
          ) : null}
          {state.error && !state.loading ? (
            <div style={{ padding: "8px 4px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: "#b91c1c" }}>Не удалось загрузить документы раздела.</span>
              <Button size="small" onClick={() => onRetry(section.id)}>
                Повторить
              </Button>
            </div>
          ) : null}
          {!state.loading && !state.error && items.length === 0 ? (
            <div style={{ padding: "12px 4px", color: "#6b7280" }}>Нет документов</div>
          ) : null}
          {items.length > 0 ? (
            <div className="law-list">
              {items.map((d) => (
                <DocItem key={d.id} d={d} onPreview={onPreview} />
              ))}
            </div>
          ) : null}
          {totalPages > 1 ? (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
              <Pagination
                size="small"
                current={state.page}
                onChange={(p) => onLoadPage(section.id, p)}
                total={state.total}
                pageSize={PAGE_SIZE}
                showSizeChanger={false}
                showTotal={(total) => `Всего: ${total}`}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 10, color: "#6b7280", fontSize: 13 }}>
          Разверните раздел, чтобы посмотреть документы
        </div>
      )}
    </details>
  );
}

export default function Documents() {
  const { t } = useI18n();
  const { route } = useHashRoute();

  // Динамический заголовок на основе URL
  const pageTitle = React.useMemo(() => {
    const pathname = route?.split("?")[0] || "";
    if (pathname === '/docs/laws') return "Законы Республики Тыва";
    if (pathname === '/docs/resolutions') return "Постановления ВХ РТ";
    if (pathname === '/docs/initiatives') return "Законодательные инициативы";
    if (pathname === '/docs/civic') return "Законодательная инициатива гражданами";
    if (pathname === '/docs/constitution') return "Реализация поправок в Конституцию РФ";
    if (pathname === '/docs/bills') return "Законопроекты";
    return t("Документы");
  }, [route, t]);

  const [cat, setCat] = React.useState("Все");
  const [year, setYear] = React.useState("Все");
  const [q, setQ] = React.useState("");
  const [qNumber, setQNumber] = React.useState("");
  const [qDate, setQDate] = React.useState("");
  const [groupByCategory, setGroupByCategory] = React.useState(true);
  const [preview, setPreview] = React.useState(null); // { url, title } — модальный предпросмотр

  // Разделы (категории) с сервера: [{ id, name, total }]
  const [sections, setSections] = React.useState([]);
  const [sectionsLoading, setSectionsLoading] = React.useState(false);
  const [sectionsError, setSectionsError] = React.useState(null);
  const [sectionsSeq, setSectionsSeq] = React.useState(0); // счётчик для retry

  // Состояние раскрытых разделов и их страниц
  const [expanded, setExpanded] = React.useState(() => new Set());
  const [sectionsData, setSectionsData] = React.useState({}); // { [id]: { items, page, total, loading, error } }

  // Плоский список (без иерархии) — тоже серверная пагинация
  const [flatData, setFlatData] = React.useState({ items: [], page: 1, total: 0, loading: false, error: null });
  const [flatPage, setFlatPage] = React.useState(1);
  const [flatRetrySeq, setFlatRetrySeq] = React.useState(0);

  const emptyState = React.useCallback(
    (items) => ({ items: items || [], page: 1, total: 0, loading: false, error: null }),
    []
  );

  // ── Фильтры → параметры сервера ───────────────────────────────────────────────
  // Поиск и номер объединяются в query: бэкенд ищет по названию/содержимому/номеру
  // со смыслом «И», как и прежний клиентский фильтр.
  const [debouncedQ, setDebouncedQ] = React.useState("");
  const [debouncedQNumber, setDebouncedQNumber] = React.useState("");
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);
  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedQNumber(qNumber.trim()), 350);
    return () => clearTimeout(id);
  }, [qNumber]);

  const serverQuery = React.useMemo(
    () => [debouncedQ, debouncedQNumber].filter(Boolean).join(" "),
    [debouncedQ, debouncedQNumber]
  );
  const serverYear = year === "Все" ? undefined : year;

  // Категория → categoryId для серверного фильтра (в плоском режиме)
  const selectedCategoryId = React.useMemo(() => {
    if (cat === "Все") return undefined;
    return sections.find((s) => s.name === cat)?.id;
  }, [cat, sections]);

  const filterKey = React.useMemo(
    () => JSON.stringify([serverQuery, serverYear, cat]),
    [serverQuery, serverYear, cat]
  );

  // ── Загрузка разделов (счётчики соответствуют фильтрам) ──────────────────────
  React.useEffect(() => {
    let alive = true;
    setSectionsLoading(true);
    setSectionsError(null);
    DocumentsApi.listSections({ query: serverQuery, year: serverYear })
      .then((list) => {
        if (!alive) return;
        setSections(list);
      })
      .catch((e) => {
        if (!alive) return;
        setSections([]);
        setSectionsError(e);
      })
      .finally(() => {
        if (alive) setSectionsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [serverQuery, serverYear, sectionsSeq]);

  // ── Сброс данных разделов при смене фильтров ─────────────────────────────────
  const filterKeyRef = React.useRef(filterKey);
  React.useEffect(() => {
    if (filterKeyRef.current === filterKey) return;
    filterKeyRef.current = filterKey;
    setSectionsData({});
    setFlatData(emptyState());
    setFlatPage(1);
  }, [filterKey, emptyState]);

  // ── Загрузка страницы документов раздела ─────────────────────────────────────
  const loadSectionPage = React.useCallback(
    (sectionId, page) => {
      setSectionsData((prev) => ({
        ...prev,
        [sectionId]: {
          items: page === 1 ? [] : prev[sectionId]?.items || [],
          page,
          total: prev[sectionId]?.total || 0,
          loading: true,
          error: null,
        },
      }));
      DocumentsApi.listPublished({
        categoryId: sectionId,
        page,
        limit: PAGE_SIZE,
        query: serverQuery,
        year: serverYear,
      })
        .then((res) => {
          const items = (Array.isArray(res?.items) ? res.items : []).map(mapApiDoc);
          setSectionsData((prev) => ({
            ...prev,
            [sectionId]: {
              items,
              page,
              total: Number(res?.total) || 0,
              loading: false,
              error: null,
            },
          }));
        })
        .catch((e) => {
          setSectionsData((prev) => ({
            ...prev,
            [sectionId]: {
              items: prev[sectionId]?.items || [],
              page,
              total: prev[sectionId]?.total || 0,
              loading: false,
              error: e,
            },
          }));
        });
    },
    [serverQuery, serverYear]
  );

  // Перезагружаем раскрытые разделы при смене фильтров
  const expandedRef = React.useRef(expanded);
  expandedRef.current = expanded;
  React.useEffect(() => {
    if (!expandedRef.current.size) return;
    for (const id of expandedRef.current) {
      loadSectionPage(id, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  const handleToggleOpen = React.useCallback(
    (sectionId, isOpen) => {
      setExpanded((prev) => {
        const next = new Set(prev);
        if (isOpen) next.add(sectionId);
        else next.delete(sectionId);
        return next;
      });
      // Documents подгружаются только при первом раскрытии раздела
      if (isOpen && !sectionsData[sectionId]?.items?.length) {
        loadSectionPage(sectionId, 1);
      }
    },
    [loadSectionPage, sectionsData]
  );

  // ── Плоский режим ─────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (groupByCategory) return undefined;
    let alive = true;
    setFlatData((prev) => ({ ...prev, loading: true, error: null }));
    DocumentsApi.listPublished({
      page: flatPage,
      limit: PAGE_SIZE,
      query: serverQuery,
      year: serverYear,
      categoryId: selectedCategoryId,
    })
      .then((res) => {
        if (!alive) return;
        const items = (Array.isArray(res?.items) ? res.items : []).map(mapApiDoc);
        setFlatData({
          items,
          page: flatPage,
          total: Number(res?.total) || 0,
          loading: false,
          error: null,
        });
      })
      .catch((e) => {
        if (!alive) return;
        setFlatData((prev) => ({ ...prev, loading: false, error: e }));
      });
    return () => {
      alive = false;
    };
  }, [groupByCategory, flatPage, serverQuery, serverYear, selectedCategoryId, flatRetrySeq]);

  const flatTotalPages = Math.ceil((flatData.total || 0) / PAGE_SIZE);
  const flatItems = flatData.items.filter((d) => matchDate(d, qDate));

  const visibleSections = React.useMemo(
    () => (cat === "Все" ? sections : sections.filter((s) => s.name === cat)),
    [sections, cat]
  );

  const catOptions = React.useMemo(
    () => ["Все", ...sections.map((s) => s.name)],
    [sections]
  );

  const handleReloadSections = React.useCallback(() => setSectionsSeq((x) => x + 1), []);

  return (
    <section className="section section--docs">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>{pageTitle}</h1>
            <DataState
              loading={sectionsLoading && sections.length === 0}
              error={sectionsError}
              onRetry={handleReloadSections}
              empty={!sectionsLoading && sections.length === 0}
              emptyDescription="Документы не найдены"
            >
              <div
                className="filters"
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                  margin: "12px 0 20px",
                  alignItems: "center",
                }}
              >
                <Space direction="vertical" size={4} style={{ minWidth: 280, flex: "1 1 320px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>
                    Поиск (название / ключевые слова / содержимое)
                  </div>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    allowClear
                    placeholder="Например: бюджет, инициатива, комиссия…"
                  />
                </Space>
                <Space direction="vertical" size={4} style={{ minWidth: 200, flex: "0 1 220px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Номер</div>
                  <Input
                    value={qNumber}
                    onChange={(e) => setQNumber(e.target.value)}
                    allowClear
                    placeholder="Например: 58-ЗРТ"
                  />
                </Space>
                <Space direction="vertical" size={4} style={{ minWidth: 200, flex: "0 1 220px" }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>Дата</div>
                  <Input
                    value={qDate}
                    onChange={(e) => setQDate(e.target.value)}
                    allowClear
                    placeholder="Например: 22.10.2025 или 2025-10"
                  />
                </Space>
                <Select
                  value={cat}
                  onChange={setCat}
                  dropdownMatchSelectWidth={false}
                  options={catOptions.map((c) => ({ value: c, label: c }))}
                  style={{ minWidth: 200 }}
                />
                <Select
                  value={year}
                  onChange={setYear}
                  dropdownMatchSelectWidth={false}
                  options={YEAR_OPTIONS.map((y) => ({
                    value: y,
                    label: y === "Все" ? "Год: Все" : `Год: ${y}`,
                  }))}
                  style={{ minWidth: 140 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
                  <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>
                    Иерархия (по категориям)
                  </span>
                  <Switch checked={groupByCategory} onChange={setGroupByCategory} />
                </div>
              </div>

              {groupByCategory ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {visibleSections.map((section) => (
                    <SectionBlock
                      key={section.id}
                      section={section}
                      open={expanded.has(section.id)}
                      onToggleOpen={handleToggleOpen}
                      state={sectionsData[section.id] || emptyState()}
                      onRetry={(id) => loadSectionPage(id, sectionsData[id]?.page || 1)}
                      onLoadPage={loadSectionPage}
                      qDate={qDate}
                      onPreview={setPreview}
                    />
                  ))}
                  {!sectionsLoading && visibleSections.length === 0 ? (
                    <div style={{ padding: "12px 4px", color: "#6b7280" }}>
                      По выбранным фильтрам ничего не найдено
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <DataState
                    loading={flatData.loading && flatItems.length === 0}
                    error={flatData.error}
                    onRetry={() => setFlatRetrySeq((x) => x + 1)}
                    empty={!flatData.loading && flatItems.length === 0}
                    emptyDescription="По выбранным фильтрам ничего не найдено"
                  >
                    <div className="law-list">
                      {flatItems.map((d) => (
                        <DocItem key={d.id} d={d} onPreview={setPreview} />
                      ))}
                    </div>
                  </DataState>
                  {flatTotalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                      <Pagination
                        current={flatPage}
                        onChange={(p) => {
                          setFlatPage(p);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        total={flatData.total}
                        pageSize={PAGE_SIZE}
                        showSizeChanger={false}
                        showTotal={(total) => `Всего: ${total}`}
                      />
                    </div>
                  )}
                </>
              )}
            </DataState>
          </div>
          <SideNav
            loadPages={true}
            autoSection={true}
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
