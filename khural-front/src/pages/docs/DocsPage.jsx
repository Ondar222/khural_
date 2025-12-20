import React from "react";
import PdfPreviewModal from "../../components/PdfPreviewModal.jsx";
import SideNav from "../../components/SideNav.jsx";
import { useData } from "../../context/DataContext.jsx";
import { useHashRoute } from "../../Router.jsx";

const CATEGORIES = [
  {
    slug: "laws",
    title: "Законы Республики Тыва",
    data: "/data/docs_laws.json",
  },
  {
    slug: "resolutions",
    title: "Постановления ВХ РТ",
    data: "/data/docs_resolutions.json",
  },
  {
    slug: "initiatives",
    title: "Законодательные инициативы",
    data: "/data/docs_initiatives.json",
  },
  {
    slug: "civic",
    title: "Законодательная инициатива гражданами",
    data: "/data/docs_civic.json",
  },
  {
    slug: "constitution",
    title: "Реализация принятых поправок в Конституцию РФ",
    data: "/data/docs_constitution.json",
  },
  { slug: "bills", title: "Законопроекты", data: "/data/docs_bills.json" },
];

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed " + path);
    return await res.json();
  } catch {
    return [];
  }
}

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
    const fromApi = (documents || []).filter((d) => d?.type === slug && d?.url);
    if (fromApi.length) {
      setDocs(
        fromApi.map((d) => ({
          id: d.id,
          title: d.title,
          desc: d.desc || d.description || "",
          number: d.number || "",
          url: d.url,
        }))
      );
      return;
    }
    fetchJson(cat.data).then(setDocs);
  }, [cat.data, documents, slug]);

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
