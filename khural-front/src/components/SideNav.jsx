import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";

// Кэшируем URL для ссылок, чтобы не создавать их каждый раз
const hrefCache = new Map();

// Нормализует pathname + search для сравнения (одинаковый порядок и кодировка параметров)
function normalizeRoute(pathname, search) {
  const path = (pathname || "/").replace(/\/+$/, "") || "/";
  if (!search || search === "?") return path;
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

// Проверяет, совпадает ли текущий маршрут с href ссылки (с кэшированием)
function isRouteActive(currentPathname, currentSearch, href) {
  if (!href || typeof href !== "string") return false;
  const current = normalizeRoute(currentPathname, currentSearch);

  // Проверяем кэш
  const cacheKey = `${href}__${current}`;
  if (hrefCache.has(cacheKey)) {
    return hrefCache.get(cacheKey);
  }

  let result = false;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(href, base + "/");
    const link = normalizeRoute(u.pathname, u.search);
    result = current === link;
  } catch {
    result = current === href;
  }

  // Ограничиваем размер кэша
  if (hrefCache.size > 100) {
    const firstKey = hrefCache.keys().next().value;
    hrefCache.delete(firstKey);
  }
  hrefCache.set(cacheKey, result);
  return result;
}

// Мемоизируем дефолтные ссылки (они не меняются)
const defaultLinks = [
  { label: "Общие сведения", href: "/about" },
  { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
  { label: "Руководство", href: "/government" },
  { label: "Депутаты", href: "/deputies?convocation=VIII" },
  { label: "Депутаты всех созывов", href: "/deputies?convocation=%D0%92%D1%81%D0%B5" },
  { label: "Депутаты (завершившие полномочия)", href: "/deputies/ended" },
  { label: "Отчеты всех Созывов", href: "/section?title=" + encodeURIComponent("Отчеты всех Созывов") },
  { label: "Отчеты комитетов", href: "/section?title=" + encodeURIComponent("Отчеты комитетов") },
  {
    label: "Представительство в Совете Федерации",
    href: "/section?title=" + encodeURIComponent("Представительство в Совете Федерации"),
  },
  { label: "Депутатские фракции", href: "/section?title=" + encodeURIComponent("Депутатские фракции") },
  { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
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

// Отдельный мемоизированный компонент ссылки
const LinkItem = React.memo(function LinkItem({
  href,
  label,
  pathname,
  search,
  isChild,
  onClick,
  t,
}) {
  // Вычисляем isActive внутри компонента на основе пропсов
  const active = href && pathname != null ? isRouteActive(pathname, search, href) : false;
  const className = `tile link ${active ? "active" : ""} ${isChild ? "sidenav__sublink" : ""}`;

  return (
    <a
      className={className}
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true">‹</span>
        {typeof label === "string" ? t(label) : label}
      </span>
    </a>
  );
}, (prev, next) => {
  // Кастомная функция сравнения для.memo
  return (
    prev.href === next.href &&
    prev.label === next.label &&
    prev.pathname === next.pathname &&
    prev.search === next.search &&
    prev.isChild === next.isChild &&
    prev.onClick === next.onClick &&
    prev.t === next.t
  );
});

// Reusable right-side navigation with links to key subpages
export default function SideNav({
  title = "Разделы",
  links: overrideLinks,
  className = "sidenav--card",
}) {
  const { t } = useI18n();
  const { route } = useHashRoute();

  // Мемоизируем pathname и search
  const [pathname, search] = React.useMemo(() => {
    const r = route || "/";
    const q = r.indexOf("?");
    if (q === -1) return [r || "/", ""];
    return [r.slice(0, q) || "/", "?" + r.slice(q + 1)];
  }, [route]);

  // Мемоизируем ссылки
  const links = React.useMemo(() => {
    return Array.isArray(overrideLinks) && overrideLinks.length ? overrideLinks : defaultLinks;
  }, [overrideLinks]);

  const titleText = typeof title === "string" ? t(title) : title;

  // Обработчик клика без создания новой функции на каждый рендер
  const handleLinkClick = React.useCallback((e, onClick) => {
    if (onClick) {
      onClick(e);
    }
  }, []);

  return (
    <aside className={`sidenav ${className || ""}`.trim()} aria-label="Ссылки раздела">
      <h3 style={{ marginTop: 0 }}>{titleText}</h3>
      <div className="sidenav__list">
        {links.map((l, i) => {
          if (Array.isArray(l.children) && l.children.length > 0) {
            return (
              <div key={i} className="sidenav__group">
                {l.href ? (
                  <LinkItem
                    key={`parent-${i}`}
                    href={l.href}
                    label={l.label}
                    pathname={pathname}
                    search={search}
                    onClick={(e) => handleLinkClick(e, l.onClick)}
                    t={t}
                  />
                ) : (
                  <div className="tile sidenav__group-title" aria-hidden="true">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span aria-hidden="true">‹</span>
                      {typeof l.label === "string" ? t(l.label) : l.label}
                    </span>
                  </div>
                )}
                <div className="sidenav__sublinks">
                  {l.children.map((sub, j) => (
                    <LinkItem
                      key={`sub-${i}-${j}`}
                      href={sub.href}
                      label={sub.label}
                      pathname={pathname}
                      search={search}
                      isChild
                      onClick={(e) => handleLinkClick(e, sub.onClick)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          }
          return (
            <LinkItem
              key={i}
              href={l.href}
              label={l.label}
              pathname={pathname}
              search={search}
              onClick={(e) => handleLinkClick(e, l.onClick)}
              t={t}
            />
          );
        })}
      </div>
    </aside>
  );
}
