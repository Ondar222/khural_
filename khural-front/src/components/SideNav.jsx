import React from "react";

// Reusable right-side navigation with links to key subpages
export default function SideNav({
  title = "Разделы",
  links: overrideLinks,
  className = "sidenav--card",
}) {
  const defaultLinks = [
    { label: "Общие сведения", href: "/about" },
    { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
    { label: "Руководство", href: "/government" },
    // "Депутаты" — по умолчанию показываем текущий созыв (если есть в данных)
    { label: "Депутаты", href: "/deputies?convocation=VIII" },
    { label: "Депутаты всех созывов", href: "/deputies?convocation=%D0%92%D1%81%D0%B5" },
    {
      label: "Представительство в Совете Федерации",
      href: "/section?title=" + encodeURIComponent("Представительство в Совете Федерации"),
    },
    { label: "Депутатские фракции", href: "/section?title=" + encodeURIComponent("Депутатские фракции") },
    { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
    { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
    {
      label: "Совет по взаимодействию с представительными органами муниципальных образований",
      href: "/about?tab=structure&focus=councils",
    },
    { label: "Структура Аппарата", href: "/apparatus" },
    {
      label: "Молодежный Хурал",
      href: "/section?title=" + encodeURIComponent("Молодежный Хурал"),
    },
  ];

  const links = Array.isArray(overrideLinks) && overrideLinks.length ? overrideLinks : defaultLinks;

  return (
    <aside className={`sidenav ${className || ""}`.trim()} aria-label="Ссылки раздела">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="sidenav__list">
        {links.map((l, i) => (
          <a key={i} className="tile link" href={l.href}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden="true">‹</span>
              {l.label}
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
