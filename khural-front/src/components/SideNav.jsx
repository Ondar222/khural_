import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";
import { AboutApi } from "../api/client.js";
import { getPreferredLocaleToken } from "../utils/pages.js";
import { pickMenuLabel, applyPagesOverridesToTree } from "../utils/pagesOverrides.js";

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

// Стандартные ссылки для раздела "Обращения" (как в Header)
const defaultLinksAppeals = [
  { label: "Обращения граждан", href: "/appeals" },
  { label: "Письменное обращение", href: "/appeals/letter" },
  { label: "Электронная приемная", href: "/appeals/online" },
  { label: "Проверить статус обращения", href: "/appeals/status" },
  { label: "Порядок рассмотрения обращений", href: "/appeals/review" },
  { label: "Порядок обжалования", href: "/appeals/complaints" },
  { label: "Обзор обращений граждан", href: "/appeals/overview" },
  { 
    label: "Ответы на обращения, затрагивающие интересы неопределенного круга лиц", 
    href: "/appeals/public-interests" 
  },
  { label: "Правовое регулирование", href: "/appeals/legal" },
  { label: "График приема граждан", href: "/appeals/schedule" },
  { label: "Минюст России", href: "/appeals/minyust" },
];

// Стандартные ссылки для раздела "Новости"
const defaultLinksNews = [
  { label: "Главные события недели", href: "/news/week" },
  { label: "Актуальные новости", href: "/news" },
  { label: "Все новости", href: "/news" },
  { label: "Медиа", href: "/news" },
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

// Преобразует дерево страниц в формат ссылок для SideNav
function pagesToLinks(pages, locale) {
  return pages.map((p) => {
    const slug = String(p.slug || "");
    const segs = slug.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
    
    // Генерируем URL: для страниц раздела news используем /news/..., а не /p/news/...
    const href = segs.length > 0 ? `/${segs.join("/")}` : `/p/${segs.join("/")}`;
    
    const label = pickMenuLabel(p, locale, { prefer: "menu" }) || p.slug;
    const children = Array.isArray(p.children) && p.children.length > 0
      ? p.children.map((c) => {
          const childSlug = String(c.slug || "");
          const childSegs = childSlug.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
          const childHref = childSegs.length > 0 ? `/${childSegs.join("/")}` : `/p/${childSegs.join("/")}`;
          const childLabel = pickMenuLabel(c, locale, { prefer: "submenu" }) || c.slug;
          return { href: childHref, label: childLabel };
        })
      : [];
    return { href, label, children };
  });
}

// Фильтрует страницы по разделу (section)
function filterPagesBySection(pages, section) {
  if (!section) return pages;
  
  // Фильтруем страницы, которые принадлежат этому разделу
  // Страницы могут быть как плоским списком, так и деревом
  const filterRecursive = (items) => {
    return items.filter((p) => {
      const slug = String(p.slug || "").replace(/^\/+|\/+$/g, "");
      // Проверяем, начинается ли slug с раздела
      const belongsToSection = slug === section || slug.startsWith(section + "/");
      
      // Если у страницы есть дети, фильтруем их тоже
      if (belongsToSection && Array.isArray(p.children)) {
        p.children = filterRecursive(p.children);
      }
      
      return belongsToSection;
    });
  };
  
  return filterRecursive(pages);
}

// Reusable right-side navigation with links to key subpages
export default function SideNav({
  title = "Разделы",
  links: overrideLinks,
  className = "sidenav--card",
  loadPages = false, // Новый проп: если true, загружать страницы из админки
  section, // Раздел для фильтрации страниц (например, "news", "deputies")
  autoSection = true, // По умолчанию автоматически определять раздел из URL
}) {
  const { t, lang } = useI18n();
  const { route } = useHashRoute();
  const locale = getPreferredLocaleToken(lang);
  const [pagesLinks, setPagesLinks] = React.useState([]);

  // Автоматически определяем раздел из URL
  const detectedSection = React.useMemo(() => {
    if (!autoSection) return section;
    if (section) return section; // Явно указанный section имеет приоритет
    
    const pathname = route?.split("?")[0] || "";
    
    // Сопоставляем пути с разделами
    const sectionMap = {
      "^/news$": "news",
      "^/news/": "news",
      "^/deputies$": "deputies",
      "^/deputies/": "deputies",
      "^/documents$": "documents",
      "^/docs/": "documents",
      "^/about$": "about",
      "^/section$": "about",
      "^/committee": "committees",
      "^/commission": "commissions",
      "^/activity": "activity",
      "^/contacts$": "contacts",
      "^/appeals": "appeals",
      "^/broadcast": "broadcast",
    };
    
    for (const [pattern, sectionName] of Object.entries(sectionMap)) {
      if (new RegExp(pattern).test(pathname)) {
        return sectionName;
      }
    }
    
    return null;
  }, [autoSection, section, route]);

  // Загружаем страницы из админки, если loadPages = true
  React.useEffect(() => {
    if (!loadPages) return;
    let alive = true;
    const fetchPages = async () => {
      try {
        const res = await AboutApi.listPagesTree({ publishedOnly: true }).catch(() => []);
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        
        console.log('[SideNav] === ЗАГРУЗКА СТРАНИЦ ===');
        console.log('[SideNav] Все страницы:', arr.map(p => ({ slug: p.slug, title: p.title, children: p.children?.length || 0 })));
        console.log('[SideNav] Текущий route:', route);
        console.log('[SideNav] pathname:', route?.split('?')[0]);
        console.log('[SideNav] Раздел (detectedSection):', detectedSection);
        
        if (alive) {
          // Фильтруем страницы по разделу, если указан
          const filtered = detectedSection ? filterPagesBySection(arr, detectedSection) : arr;
          console.log('[SideNav] Отфильтрованные страницы (раздел=' + detectedSection + '):', filtered.map(p => ({ slug: p.slug, title: p.title })));
          
          const links = pagesToLinks(applyPagesOverridesToTree(filtered), locale);
          console.log('[SideNav] Ссылки для меню:', links);
          console.log('[SideNav] =========================');
          setPagesLinks(links);
        }
      } catch (err) {
        console.error('[SideNav] Error loading pages:', err);
        if (alive) setPagesLinks([]);
      }
    };
    fetchPages();
    
    // Слушаем событие перезагрузки страниц
    const onPagesReload = () => {
      console.log('[SideNav] Получено событие khural:pages-reload');
      fetchPages();
    };
    window.addEventListener("khural:pages-reload", onPagesReload);
    
    return () => { 
      alive = false;
      window.removeEventListener("khural:pages-reload", onPagesReload);
    };
  }, [loadPages, lang, locale, detectedSection]);

  // Force re-render on resize to fix display issues on some devices
  const [, setForceUpdate] = React.useState(0);
  React.useEffect(() => {
    const handleResize = () => setForceUpdate(n => n + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Мемоизируем pathname и search
  const [pathname, search] = React.useMemo(() => {
    const r = route || "/";
    const q = r.indexOf("?");
    if (q === -1) return [r || "/", ""];
    return [r.slice(0, q) || "/", "?" + r.slice(q + 1)];
  }, [route]);

  // Мемоизируем ссылки: приоритет - overrideLinks, затем загруженные страницы + defaultLinks, затем defaultLinks
  const links = React.useMemo(() => {
    // Если переданы свои ссылки вручную, используем их
    if (Array.isArray(overrideLinks) && overrideLinks.length) return overrideLinks;
    
    // Определяем стандартные ссылки для текущего раздела
    let sectionDefaultLinks = defaultLinks;
    if (detectedSection === 'appeals') {
      sectionDefaultLinks = defaultLinksAppeals;
    } else if (detectedSection === 'news') {
      sectionDefaultLinks = defaultLinksNews;
    }
    
    // Если загружаем страницы, добавляем их к стандартным ссылкам
    if (loadPages && pagesLinks.length > 0) {
      // Добавляем загруженные страницы в начало списка
      return [...pagesLinks, ...sectionDefaultLinks];
    }
    
    // Иначе используем стандартные ссылки раздела
    return sectionDefaultLinks;
  }, [overrideLinks, loadPages, pagesLinks, detectedSection]);

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
