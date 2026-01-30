import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";

// Нормализует pathname + search для сравнения (одинаковый порядок и кодировка параметров)
function normalizeRoute(pathname, search) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  if (!search || search === "?") return path;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// Проверяет, совпадает ли текущий маршрут с href ссылки
function isRouteActive(currentPathname, currentSearch, href) {
  if (!href || typeof href !== "string") return false;
  const current = normalizeRoute(currentPathname, currentSearch);
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(href, base + "/");
    const link = normalizeRoute(u.pathname, u.search);
    return current === link;
  } catch {
    return current === href;
  }
}

// Reusable right-side navigation with links to key subpages
export default function SideNav({
  title = "Разделы",
  links: overrideLinks,
  className = "sidenav--card",
}) {
  const { t } = useI18n();
  const { route } = useHashRoute();
  const [pathname, search] = React.useMemo(() => {
    const r = route || "/";
    const q = r.indexOf("?");
    if (q === -1) return [r || "/", ""];
    return [r.slice(0, q) || "/", "?" + r.slice(q + 1)];
  }, [route]);

  const defaultLinks = [
    { label: "Общие сведения", href: "/about" },
    { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
    { label: "Руководство", href: "/government" },
    // {
    //   label: "Руководство парламента",
    //   href: "/section?title=" + encodeURIComponent("Руководство парламента"),
    // },
    // "Депутаты" — по умолчанию показываем текущий созыв (если есть в данных)
    { label: "Депутаты", href: "/deputies?convocation=VIII" },
    { label: "Депутаты всех созывов", href: "/deputies?convocation=%D0%92%D1%81%D0%B5" },
    { label: "Депутаты (завершившие полномочия)", href: "/deputies/ended" },
    { label: "Отчеты всех Созывов", href: "/section?title=" + encodeURIComponent("Отчеты всех Созывов") },
    // Пользовательские страницы, созданные через админку
    // { label: "Страницы", href: "/pages" },
    {
      label: "Представительство в Совете Федерации",
      href: "/section?title=" + encodeURIComponent("Представительство в Совете Федерации"),
    },
    { label: "Депутатские фракции", href: "/section?title=" + encodeURIComponent("Депутатские фракции") },
    { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
    { label: "Созывы", href: "/convocations" },
    { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
    {
      label: "Совет по взаимодействию с представительными органами муниципальных образований",
      href:
        "/section?title=" +
        encodeURIComponent("Совет по взаимодействию с представительными органами муниципальных образований"),
    },
    { label: "Структура Аппарата", href: "/section?title=" + encodeURIComponent("Структура Аппарата") },
    {
      label: "Молодежный Хурал",
      href: "/section?title=" + encodeURIComponent("Молодежный Хурал"),
    },
  ];

  const links = Array.isArray(overrideLinks) && overrideLinks.length ? overrideLinks : defaultLinks;
  const titleText = typeof title === "string" ? t(title) : title;

  return (
    <aside className={`sidenav ${className || ""}`.trim()} aria-label="Ссылки раздела">
      <h3 style={{ marginTop: 0 }}>{titleText}</h3>
      <div className="sidenav__list">
        {links.map((l, i) => {
          const isActive =
            l.isActive !== undefined && l.isActive !== null
              ? Boolean(l.isActive)
              : isRouteActive(pathname, search, l.href);
          return (
            <a
              key={i}
              className={`tile link ${isActive ? "active" : ""}`}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                if (l.onClick) {
                  l.onClick(e);
                }
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span aria-hidden="true">‹</span>
                {typeof l.label === "string" ? t(l.label) : l.label}
              </span>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
