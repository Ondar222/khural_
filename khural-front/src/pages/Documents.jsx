import React from "react";
import { useData } from "../context/DataContext.jsx";
import { Input, Select, Space, Switch, Pagination } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";
import ScrollToTop from "../components/ScrollToTop.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";
import { decodeHtmlEntities } from "../utils/html.js";

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

export default function Documents() {
  const { documents, loading, errors, reload } = useData();
  const [cat, setCat] = React.useState("Все");
  const [year, setYear] = React.useState("Все");
  const [q, setQ] = React.useState("");
  const [qNumber, setQNumber] = React.useState("");
  const [qDate, setQDate] = React.useState("");
  const [groupByCategory, setGroupByCategory] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 10;

  const cats = React.useMemo(
    () => ["Все", ...Array.from(new Set(documents.map((d) => d.category).filter(Boolean)))],
    [documents]
  );
  const years = React.useMemo(() => {
    const ys = new Set();
    for (const d of documents) {
      const match = String(d.date || d.createdAt || "").match(/(20\\d{2})/);
      if (match) ys.add(match[1]);
    }
    return ["Все", ...Array.from(ys).sort((a, b) => Number(b) - Number(a))];
  }, [documents]);
  const filtered = React.useMemo(
    () =>
      documents.filter(
        (d) =>
          (cat === "Все" || d.category === cat) &&
          (year === "Все" || String(d.date || d.createdAt || "").includes(year)) &&
          (() => {
            const qq = norm(q);
            const qn = norm(qNumber);
            const qd = norm(qDate);

            if (qn && !norm(d.number).includes(qn)) return false;
            if (qd && !norm(d.date || d.createdAt).includes(qd)) return false;

            if (!qq) return true;
            const hay = [
              d.title,
              d.desc,
              d.description,
              d.category,
              d.type,
              d.number,
              d.date,
              d.createdAt,
              // optional fields if backend provides them
              d.keywords,
              d.text,
              d.content,
            ]
              .filter(Boolean)
              .map(norm)
              .join(" • ");
            return hay.includes(qq);
          })()
      ),
    [documents, cat, year, q, qNumber, qDate]
  );

  const grouped = React.useMemo(() => {
    const map = new Map();
    for (const d of filtered) {
      const key = d.category || "Без категории";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "ru"));
    // sort each group by date desc (best-effort)
    entries.forEach(([, arr]) => {
      arr.sort((a, b) => String(b.date || b.createdAt || "").localeCompare(String(a.date || a.createdAt || "")));
    });
    return entries;
  }, [filtered]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [cat, year, q, qNumber, qDate, groupByCategory]);

  // Pagination for flat list
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Pagination for grouped view
  const groupedPaginated = React.useMemo(() => {
    const allItems = grouped.flatMap(([, items]) => items);
    const total = allItems.length;
    const paginated = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    
    // Re-group paginated items
    const map = new Map();
    for (const d of paginated) {
      const key = d.category || "Без категории";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "ru"));
    return { entries, total };
  }, [grouped, page]);

  return (
    <section className="section section--docs">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>Документы</h1>
            <DataState
              loading={Boolean(loading?.documents) && (!documents || documents.length === 0)}
              error={errors?.documents}
              onRetry={reload}
              empty={!loading?.documents && (!documents || documents.length === 0)}
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
                  options={cats.map((c) => ({ value: c, label: c }))}
                  style={{ minWidth: 200 }}
                />
                <Select
                  value={year}
                  onChange={setYear}
                  dropdownMatchSelectWidth={false}
                  options={years.map((y) => ({
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
              <DataState
                loading={false}
                error={null}
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                {groupByCategory ? (
                  <div style={{ display: "grid", gap: 10 }}>
                    {groupedPaginated.entries.map(([categoryName, items]) => (
                      <details key={categoryName} open className="tile" style={{ margin: 0 }}>
                        <summary style={{ cursor: "pointer", fontWeight: 900 }}>
                          {categoryName} <span style={{ opacity: 0.7 }}>({items.length})</span>
                        </summary>
                        <div className="law-list" style={{ marginTop: 10 }}>
                          {items.map((d) => {
                            const url = normalizeFilesUrl(d.url || d.file?.link || "");
                            return (
                              <div key={d.id || url || d.title} className="law-item card">
                                <div className="law-left">
                                  <div className="law-ico">📄</div>
                                  <div>
                                    <div className="law-title">{d.title}</div>
                                    {renderDocDesc(d.desc)}
                                    <div className="card-subtitle">
                                      {d.number ? `${d.number} • ` : ""}
                                      {d.date || d.createdAt || ""}
                                      {d.category ? ` • ${d.category}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                                  <a
                                    className="btn btn--primary"
                                    href={url || (d.id && !d.id.startsWith("zakony-") && !d.id.startsWith("postamovleniya-") ? `#/documents/${d.id}` : "#")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={url && !url.includes(".pdf") ? true : undefined}
                                  >
                                    Открыть ↗
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="law-list">
                      {paginatedItems.map((d) => {
                        const url = normalizeFilesUrl(d.url || d.file?.link || "");
                        return (
                          <div key={d.id || url || d.title} className="law-item card">
                            <div className="law-left">
                              <div className="law-ico">📄</div>
                              <div>
                                <div className="law-title">{d.title}</div>
                                {renderDocDesc(d.desc)}
                                <div className="card-subtitle">
                                  {d.number ? `${d.number} • ` : ""}
                                  {d.date || d.createdAt || ""}
                                  {d.category ? ` • ${d.category}` : ""}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
                              <a
                                className="btn btn--primary"
                                href={url || (d.id && !d.id.startsWith("zakony-") && !d.id.startsWith("postamovleniya-") ? `#/documents/${d.id}` : "#")}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={url && !url.includes(".pdf") ? true : undefined}
                              >
                                Открыть ↗
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                        <Pagination
                          current={page}
                          onChange={setPage}
                          total={filtered.length}
                          pageSize={PAGE_SIZE}
                          showSizeChanger={false}
                          showTotal={(total) => `Всего: ${total}`}
                        />
                      </div>
                    )}
                  </>
                )}
                {groupByCategory && groupedPaginated.total > PAGE_SIZE && (
                  <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                    <Pagination
                      current={page}
                      onChange={setPage}
                      total={groupedPaginated.total}
                      pageSize={PAGE_SIZE}
                      showSizeChanger={false}
                      showTotal={(total) => `Всего: ${total}`}
                    />
                  </div>
                )}
              </DataState>
            </DataState>
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
