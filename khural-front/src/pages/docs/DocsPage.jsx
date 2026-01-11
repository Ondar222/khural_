import React from "react";
import PdfPreviewModal from "../../components/PdfPreviewModal.jsx";
import SideNav from "../../components/SideNav.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";

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
  const [preview, setPreview] = React.useState(null); // {url, title}

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
        url: typeof d.url === "string" ? d.url : d.url ? String(d.url) : "",
      }))
    );
  }, [documents, slug]);

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>{cat.title}</h1>
            <div className="law-list">
              {docs.map((d) => (
                <div key={d.id || d.url} className="law-item card">
                  <div className="law-left">
                    <div className="law-ico">📄</div>
                    <div>
                      <div className="law-title">{d.title}</div>
                      {d.desc && <div className="law-desc">{d.desc}</div>}
                      {d.number && <div className="law-status">№ {d.number}</div>}
                    </div>
                  </div>
                  <a
                    className="btn btn--primary"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreview({ url: d.url, title: d.title });
                    }}
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
      <PdfPreviewModal
        open={!!preview}
        onClose={() => setPreview(null)}
        url={preview?.url}
        title={preview?.title}
      />
    </section>
  );
}
