import React from "react";
import { useData } from "../context/DataContext.jsx";
import { Select } from "antd";
import SideNav from "../components/SideNav.jsx";
import DataState from "../components/DataState.jsx";

export default function Documents() {
  const { documents, loading, errors, reload } = useData();
  const [cat, setCat] = React.useState("Все");
  const [year, setYear] = React.useState("Все");
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
          (year === "Все" || String(d.date || d.createdAt || "").includes(year))
      ),
    [documents, cat, year]
  );

  return (
    <section className="section">
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
                }}
              >
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
              </div>
              <DataState
                loading={false}
                error={null}
                empty={filtered.length === 0}
                emptyDescription="По выбранным фильтрам ничего не найдено"
              >
                <div className="law-list">
                  {filtered.map((d) => (
                    <a
                      key={d.id}
                      className="law-item card"
                      href={d.url || d.file?.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="law-left">
                        <div className="law-ico">📄</div>
                        <div>
                          <div className="law-title">{d.title}</div>
                          <div className="card-subtitle">
                            {d.number ? `${d.number} • ` : ""}
                            {d.date || d.createdAt || ""}
                            {d.category ? ` • ${d.category}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#0a1f44" }}>↗</div>
                    </a>
                  ))}
                </div>
              </DataState>
            </DataState>
          </div>
          <SideNav
            title="Документы"
            links={[
              { label: "Законы Республики Тыва", href: "#/docs/laws" },
              { label: "Постановления ВХ РТ", href: "#/docs/resolutions" },
              {
                label: "Законодательные инициативы",
                href: "#/docs/initiatives",
              },
              {
                label: "Законодательная инициатива гражданами",
                href: "#/docs/civic",
              },
              {
                label: "Реализация поправок в Конституцию РФ",
                href: "#/docs/constitution",
              },
              { label: "Законопроекты", href: "#/docs/bills" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
