import React from "react";

const LINKS = [
  { label: "Главная", href: "/" },
  { label: "О Верховном Хурале", href: "/about" },
  { label: "Депутаты", href: "/deputies" },
  { label: "Новости", href: "/news" },
  { label: "Календарь", href: "/calendar" },
  { label: "Документы", href: "/documents" },
  { label: "Законы Республики Тыва", href: "/docs/laws" },
  { label: "Постановления ВХ РТ", href: "/docs/resolutions" },
  { label: "Законодательные инициативы", href: "/docs/initiatives" },
  { label: "Обращения граждан", href: "/appeals" },
  { label: "Контакты", href: "/contacts" },
  { label: "Политика обработки ПДн", href: "/pd-policy" },
  { label: "Лицензия", href: "/license" },
];

export default function Sitemap() {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 960 }}>
        <h1>Карта сайта</h1>
        <div className="grid" style={{ marginTop: 12 }}>
          {LINKS.map((l) => (
            <a key={l.href} className="tile link" href={l.href} style={{ display: "block" }}>
              <div style={{ fontWeight: 800 }}>{l.label}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>{l.href}</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}


