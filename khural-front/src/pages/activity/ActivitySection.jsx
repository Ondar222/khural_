import React from "react";
import SideNav from "../../components/SideNav.jsx";

const SECTIONS = [
  { slug: "plan", title: "План работы", data: "/data/activity_plan.json" },
  {
    slug: "national-projects",
    title: "Депутатский контроль: национальные проекты",
    data: "/data/activity_national.json",
  },
  {
    slug: "reports",
    title: "Отчёты о деятельности",
    data: "/data/activity_reports.json",
  },
  {
    slug: "sessions",
    title: "Заседания сессий Верховного Хурала",
    data: "/data/activity_sessions.json",
  },
  {
    slug: "statistics",
    title: "Статистика законотворчества",
    data: "/data/activity_statistics.json",
  },
  {
    slug: "schet_palata",
    title: "Счётная палата Республики Тыва",
    data: "/data/activity_audit.json",
  },
];

function getSlugFromHash() {
  const h = window.location.hash.replace(/^#/, "");
  const parts = h.split("/").filter(Boolean);
  // expected: ["activity", "<slug>"]
  return parts[1] || "reports";
}

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed " + path);
    return await res.json();
  } catch (e) {
    console.warn("Activity section load error", path, e);
    return { items: [] };
  }
}

export default function ActivitySectionPage() {
  const [slug, setSlug] = React.useState(getSlugFromHash());
  const section = SECTIONS.find((s) => s.slug === slug) || SECTIONS[0];
  const [data, setData] = React.useState({ items: [] });

  React.useEffect(() => {
    const onHash = () => setSlug(getSlugFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    fetchJson(section.data).then(setData);
  }, [section.data]);

  const sidebarLinks = [
    { label: "План работы", href: "#/activity/plan" },
    {
      label: "Депутатский контроль: национальные проекты",
      href: "#/activity/national-projects",
    },
    { label: "Отчёты о деятельности", href: "#/activity/reports" },
    {
      label: "Заседания сессий Верховного Хурала",
      href: "#/activity/sessions",
    },
    { label: "Статистика законотворчества", href: "#/activity/statistics" },
    {
      label: "Счётная палата Республики Тыва",
      href: "#/activity/schet_palata",
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1>{section.title}</h1>
            <div className="grid">
              {(data.items || []).map((it) => (
                <a
                  key={(it.url || it.title) + (it.date || "")}
                  className="tile link"
                  href={it.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {it.date && (
                    <div style={{ color: "#6b7280", fontSize: 13 }}>
                      {it.date}
                    </div>
                  )}
                  <div style={{ fontWeight: 800, marginTop: 4 }}>
                    {it.title}
                  </div>
                  {it.desc && <div style={{ marginTop: 8 }}>{it.desc}</div>}
                  <div className="link" style={{ marginTop: 8 }}>
                    Открыть →
                  </div>
                </a>
              ))}
            </div>
          </div>
          <SideNav title="Разделы" links={sidebarLinks} />
        </div>
      </div>
    </section>
  );
}
