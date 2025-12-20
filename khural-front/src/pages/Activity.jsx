import React from "react";
import SideNav from "../components/SideNav.jsx";

async function fetchJson(path) {
  try {
    const res = await fetch(path, { cache: "no-cache" });
    if (!res.ok) throw new Error("Failed " + path);
    return await res.json();
  } catch (e) {
    console.warn("Activity data load error", path, e);
    return { sidebar: [], reports: [] };
  }
}

export default function ActivityPage() {
  const [data, setData] = React.useState({ sidebar: [], reports: [] });
  React.useEffect(() => {
    fetchJson("/data/activity.json").then(setData);
  }, []);

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
            <h1>Деятельность</h1>
            <div className="grid">
              {(data.reports || []).map((item) => (
                <a key={item.url} className="tile link" href="#/activity/reports">
                  <div style={{ fontWeight: 800 }}>{item.title}</div>
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
