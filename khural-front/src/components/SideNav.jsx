import React from "react";

// Reusable right-side navigation with links to key subpages
export default function SideNav({ title = "Разделы", links: overrideLinks }) {
  const defaultLinks = [
    { label: "Руководство", href: "#/government" },
    { label: "Депутаты", href: "#/deputies" },
    { label: "Депутаты всех созывов", href: "#/deputies" },
    {
      label: "Представительство в Совете Федерации",
      href:
        "#/section?title=" +
        encodeURIComponent("Представительство в Совете Федерации"),
    },
    {
      label: "Депутатские фракции",
      href: "#/section?title=" + encodeURIComponent("Депутатские фракции"),
    },
    { label: "Комитеты", href: "#/committee" },
    {
      label: "Комиссии",
      href: "#/section?title=" + encodeURIComponent("Комиссии"),
    },
    {
      label:
        "Совет по взаимодействию с представительными органами муниципальных образований",
      href:
        "#/section?title=" +
        encodeURIComponent(
          "Совет по взаимодействию с представительными органами муниципальных образований"
        ),
    },
    { label: "Аппарат", href: "#/apparatus" },
    {
      label: "Молодежный Хурал",
      href: "#/section?title=" + encodeURIComponent("Молодежный Хурал"),
    },
  ];

  const links =
    Array.isArray(overrideLinks) && overrideLinks.length
      ? overrideLinks
      : defaultLinks;

  return (
    <aside className="sidenav" aria-label="Ссылки раздела">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="sidenav__list">
        {links.map((l, i) => (
          <a key={i} className="tile link" href={l.href}>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span aria-hidden="true">‹</span>
              {l.label}
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
