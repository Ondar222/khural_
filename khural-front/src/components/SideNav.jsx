import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useHashRoute } from "../Router.jsx";
import Link from "./Link.jsx";
import { AboutApi } from "../api/client.js";
import { getPreferredLocaleToken } from "../utils/pages.js";
import { pickMenuLabel, applyPagesOverridesToTree } from "../utils/pagesOverrides.js";
import { normalizePathBySlugAliases } from "../utils/slugAliases.js";
import {
  PERSONNEL_ROOT_PATH,
  PERSONNEL_TITLE,
  PERSONNEL_NAV_LINKS,
  PERSONNEL_SIDE_NAV,
  getPersonnelPage,
} from "../content/personnel.js";

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

// Извлекает hash из href
function getHashFromHref(href) {
  if (!href || typeof href !== "string") return null;
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  return href.substring(hashIndex);
}

// Проверяет, совпадает ли текущий маршрут с href ссылки (с кэшированием)
function isRouteActive(currentPathname, currentSearch, currentHash, href) {
  if (!href || typeof href !== "string") return false;
  const current = normalizeRoute(currentPathname, currentSearch);

  // Проверяем кэш
  const cacheKey = `${href}__${current}__${currentHash || ""}`;
  if (hrefCache.has(cacheKey)) {
    return hrefCache.get(cacheKey);
  }

  let result = false;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const u = new URL(href, base + "/");
    const link = normalizeRoute(u.pathname, u.search);
    const linkHash = getHashFromHref(href);
    
    // Сравниваем pathname+search и hash (если он есть в href)
    const pathsMatch = current === link;
    if (!pathsMatch) {
      result = false;
    } else if (linkHash) {
      // Если в ссылке есть hash, сравниваем его с текущим hash
      result = currentHash === linkHash;
    } else {
      // Если в ссылке нет hash, сравниваем только пути
      result = true;
    }
  } catch (err) {
    // Если URL невалидный, сравниваем как строки
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
  { label: "Руководство парламента", href: "/section?title=" + encodeURIComponent("Руководство парламента") },
  { label: "Депутаты", href: "/deputies?convocation=VIII" },
  { label: "Депутаты всех созывов", href: "/deputies?convocation=%D0%92%D1%81%D0%B5" },
  { label: "Депутаты (завершившие полномочия)", href: "/deputies/ended" },
  // { label: "Отчеты всех Созывов", href: "/section?title=" + encodeURIComponent("Отчеты всех Созывов") }, // Скрыто временно
  { label: "Отчеты комитетов", href: "/section?title=" + encodeURIComponent("Отчеты комитетов") },
  {
    label: "Представительство в Совете Федерации",
    href: "/struct/council",
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
    href: "/youth-parliament",
  },
  // Информация
  { label: "Финансы", href: "/info/finansy" },
  { label: "Избирательные округа", href: "/info/iokrug" },
  { label: "Уполномоченный по правам человека", href: "/info/upoln-po-prav" },
  { label: "Уполномоченный по правам ребенка", href: "/info/upoln-po-reb" },
  PERSONNEL_NAV_LINKS,
  { label: "Законодательная карта", href: "/info/zakon-karta" },
  { label: "История парламентаризма", href: "/about/istoriya-parlamentarizma" },
  { label: "Полномочия", href: "/info/polnomochiya" },
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
  { label: "Главные события", href: "/news/week" },
  { label: "Актуальные новости", href: "/news?section=actual" },
  { label: "Все новости", href: "/news?section=all" },
  { label: "Медиа", href: "/news?section=media" },
  // Дополнительные ссылки новостей (фиксированные)
  { label: "Новости председателя", href: "/news?category=новости председателя" },
  { label: "Кодекс чести мужчины Тувы", href: "/code-of-honor" },
  { label: "Свод заповедей матерей Тувы", href: "/mothers-commandments" },
  { label: "Для СМИ", href: "/for-media" },
  { label: "Трансляции", href: "/broadcast" },
];

// Стандартные ссылки для раздела "Трансляции" (фиксированное меню)
const defaultLinksBroadcast = [
  { label: "Главные события", href: "/news/week" },
  { label: "Актуальные новости", href: "/news?section=actual" },
  { label: "Все новости", href: "/news?section=all" },
  { label: "Медиа", href: "/news?section=media" },
  { label: "Новости председателя", href: "/news?category=новости председателя" },
  { label: "Кодекс чести мужчины Тувы", href: "/code-of-honor" },
  { label: "Свод заповедей матерей Тувы", href: "/mothers-commandments" },
  { label: "Для СМИ", href: "/for-media" },
  { label: "Трансляции", href: "/broadcast" },
];

// Стандартные ссылки для раздела "Общие сведения"
const defaultLinksCommon = [
  { label: "Финансы", href: "/about/finances" },
  { label: "Избирательные округа", href: "/info/iokrug" },
  { label: "Законодательная карта", href: "/info/zakon-karta" },
  { label: "Открытые данные", href: "/opendata" },
  { label: "Уполномоченный по правам человека", href: "/info/upoln-po-prav" },
  { label: "Уполномоченный по правам ребенка", href: "/info/upoln-po-reb" },
  { label: "Полномочия Председателя", href: "/info/polnomochiya-spikera" },
  { label: "Противодействие коррупции", href: "/info/protivodeystvie-korrupcii" },
  { label: "Контактная информация", href: "/info/contacts" },
  { label: "Государственные символы Республики Тыва", href: "/info/gosudarstvennye-simvoly" },
  { label: "Приграничный субъект", href: "/info/prigranichny-subekt" },
  PERSONNEL_NAV_LINKS,
];

// Стандартные ссылки для раздела "Депутаты" (без дублирования с "Общими сведениями")
const defaultLinksDeputies = [
  { label: "Депутаты", href: "/deputies" },
  { label: "Депутаты всех созывов", href: "/deputies?convocation=%D0%92%D1%81%D0%B5" },
  { label: "Депутаты (завершившие полномочия)", href: "/deputies/ended" },
];

// Стандартные ссылки для раздела "О Хурале" (без дублирования с "Общими сведениями")
const defaultLinksAbout = [
  { label: "Общие сведения", href: "/about" },
  { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
  { label: "Руководство парламента", href: "/section?title=" + encodeURIComponent("Руководство парламента") },
  {
    label: "Совет по взаимодействию с представительными органами муниципальных образований",
    href: "/section?title=" + encodeURIComponent("Совет по взаимодействию с представительными органами муниципальных образований"),
  },
  { label: "Молодежный Хурал", href: "/youth-parliament" },
  { label: "Представительство в Совете Федерации", href: "/struct/council" },
  { label: "История парламентаризма", href: "/about/istoriya-parlamentarizma" },
  { label: "Полномочия", href: "/info/polnomochiya" },
];

// Стандартные ссылки для раздела "Деятельность"
const defaultLinksActivity = [
  { label: "Деятельность", href: "/activity" },
  { label: "Законотворчество", href: "/activity?tab=legislation" },
  { label: "Контрольная деятельность", href: "/activity?tab=control" },
  { label: "Кадровая деятельность", href: "/activity?tab=personnel" },
  { label: "Международная деятельность", href: "/activity?tab=international" },
  { label: "Взаимодействие с НКО", href: "/activity?tab=ngo" },
];

// Стандартные ссылки для раздела "Комитеты" и "Комиссии" (как в разделе "О Хурале")
const defaultLinksCommittees = [
  { label: "Общие сведения", href: "/about" },
  { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
  { label: "Руководство парламента", href: "/section?title=" + encodeURIComponent("Руководство парламента") },
  { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
  { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
  { label: "Отчеты комитетов", href: "/section?title=" + encodeURIComponent("Отчеты комитетов") },
  { label: "Повестки комитетов", href: "/section?title=" + encodeURIComponent("Повестки комитетов") },
  { label: "Представительство в Совете Федерации", href: "/struct/council" },
];

// Отдельный мемоизированный компонент ссылки
const LinkItem = React.memo(function LinkItem({
  href,
  label,
  pathname,
  search,
  hash,
  isChild,
  onClick,
  t,
}) {
  // Вычисляем isActive внутри компонента на основе пропсов
  const active = href && pathname != null ? isRouteActive(pathname, search, hash, href) : false;
  const className = `tile link ${active ? "active" : ""} ${isChild ? "sidenav__sublink" : ""}`;

  return (
    <Link
      className={className}
      to={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span aria-hidden="true">‹</span>
        {typeof label === "string" ? t(label) : label}
      </span>
    </Link>
  );
}, (prev, next) => {
  // Кастомная функция сравнения для.memo
  return (
    prev.href === next.href &&
    prev.label === next.label &&
    prev.pathname === next.pathname &&
    prev.search === next.search &&
    prev.hash === next.hash &&
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

// Фильтрует страницы по разделу (section). Возвращает НОВЫЕ объекты и не мутирует входные данные.
function filterPagesBySection(pages, section) {
  if (!section) return pages;

  const filterRecursive = (items) => {
    const list = Array.isArray(items) ? items : [];
    const result = [];
    for (const p of list) {
      const slug = String(p?.slug || "").replace(/^\/+|\/+$/g, "");
      const belongsToSection = slug === section || slug.startsWith(section + "/");
      if (!belongsToSection) continue;

      if (Array.isArray(p.children) && p.children.length > 0) {
        const filteredChildren = filterRecursive(p.children);
        result.push({ ...p, children: filteredChildren });
      } else {
        result.push({ ...p });
      }
    }
    return result;
  };

  return filterRecursive(pages);
}

// Reusable right-side navigation with links to key subpages
export default function SideNav({
  title, // Заголовок (если не указан, определяется автоматически)
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

  // Сырой путь из URL и путь, нормализованный через алиасы slug
  // (/about/districts → /info/iokrug). Нормализованный путь используется для
  // определения раздела, заголовока и подсветки активной ссылки, чтобы алиасные
  // URL давали ровно то же меню, что и канонические.
  const rawPathname = (route || "/").split("?")[0] || "/";
  const canonicalPathname = React.useMemo(
    () => normalizePathBySlugAliases(rawPathname),
    [rawPathname]
  );

  // Автоматически определяем раздел из URL
  const detectedSection = React.useMemo(() => {
    if (!autoSection) return section;
    if (section) return section; // Явно указанный section имеет приоритет

    const pathname = canonicalPathname;

    // Сопоставляем пути с разделами
    const sectionMap = {
      "^/news$": "news",
      "^/news/.*": "news",
      "^/code-of-honor$": "news",
      "^/mothers-commandments$": "news",
      "^/for-media$": "news",
      "^/deputies$": "deputies",
      "^/deputies/.*": "deputies",
      "^/documents$": "documents",
      "^/docs/.*": "documents",
      "^/about/finances$": "common",
      "^/about/finances/.*": "common",
      "^/about/istoriya-parlamentarizma$": "about",
      "^/about/polnomochiya$": "about",
      "^/about$": "about",
      "^/section$": "about",
      "^/committee.*": "committees",
      "^/commission.*": "commissions",
      "^/activity": "activity",
      "^/contacts$": "contacts",
      "^/appeals": "appeals",
      "^/broadcast": "broadcast",
      "^/info/polnomochiya-spikera$": "common",
      "^/info/polnomochiya-speaker$": "common",
      "^/info/speaker-powers$": "common",
      "^/info/protivodeystvie-korrupcii.*": "common",
      "^/info/anti-corruption.*": "common",
      "^/info/contacts$": "common",
      "^/info/upoln-po-reb$": "common",
      "^/info/child-rights$": "common",
      "^/info/gosudarstvennye-simvoly$": "common",
      "^/info/symbols$": "common",
      "^/info/prigranichny-subekt.*": "common",
      "^/info/border-subekt.*": "common",
      "^/info/border-subject.*": "common",
      "^/info/finansy.*": "common",
      "^/info/iokrug.*": "common",
      "^/info/zakon-karta$": "common",
      "^/info/upoln-po-prav$": "common",
      "^/info": "common",
      "^/opendata": "common",
      "^/youth-parliament": "youth",
      "^/struct/council": "about",
      "^/government": "about",
    };

    for (const [pattern, sectionName] of Object.entries(sectionMap)) {
      if (new RegExp(pattern).test(pathname)) {
        return sectionName;
      }
    }

    return null;
  }, [autoSection, section, route]);

  // Автоматически определяем заголовок на основе раздела и конкретной страницы
  const autoTitle = React.useMemo(() => {
    if (!detectedSection) return "Новости";

    const pathname = canonicalPathname;
    const queryString = (route || "").split("?")[1] || "";

    // Парсим query параметры вручную для надёжности
    const getQueryParam = (name) => {
      const params = new URLSearchParams(queryString);
      return params.get(name);
    };
    
    const sectionParam = getQueryParam("section");
    const categoryParam = getQueryParam("category");

    // Специфичные заголовки для страниц новостей
    if (detectedSection === 'news') {
      const queryString = route?.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const sectionParam = params.get("section");
      const categoryParam = params.get("category");

      if (pathname === '/news/week') return "Главные события";
      if (pathname === '/code-of-honor') return "Кодекс чести мужчины Тувы";
      if (pathname === '/mothers-commandments') return "Свод заповедей матерей Тувы";
      if (sectionParam === 'actual') return "Актуальные новости";
      if (sectionParam === 'all') return "Все новости";
      if (sectionParam === 'media') return "Медиа";
      if (categoryParam && String(categoryParam).toLowerCase().includes('новости председателя')) return "Новости председателя";
      return "Новости";
    }
    
    // Специфичные заголовки для раздела "Обращения"
    if (detectedSection === 'appeals') {
      if (pathname === '/appeals') return "Обращения граждан";
      if (pathname === '/appeals/letter') return "Письменное обращение";
      if (pathname === '/appeals/online') return "Электронная приемная";
      if (pathname === '/appeals/status') return "Проверить статус обращения";
      if (pathname === '/appeals/review') return "Порядок рассмотрения обращений";
      if (pathname === '/appeals/complaints') return "Порядок обжалования";
      if (pathname === '/appeals/overview') return "Обзор обращений граждан";
      if (pathname === '/appeals/public-interests') return "Ответы на обращения";
      if (pathname === '/appeals/legal') return "Правовое регулирование";
      if (pathname === '/appeals/schedule') return "График приема граждан";
      if (pathname === '/appeals/minyust') return "Минюст России";
      return "Обращения";
    }
    
    if (detectedSection === 'common') {
      if (pathname === '/info') return "Общие сведения";
      if (pathname === '/about/finances') return "Финансы";
      if (pathname.startsWith('/about/finances/')) return "Финансы";
      if (pathname === '/info/finansy') return "Финансы";
      if (pathname.startsWith('/info/finansy')) return "Финансы";
      if (pathname === '/info/iokrug') return "Избирательные округа";
      if (pathname === '/info/zakon-karta') return "Законодательная карта";
      if (pathname === '/opendata') return "Открытые данные";
      if (pathname === '/info/upoln-po-prav') return "Уполномоченный по правам человека";
      if (pathname === '/info/upoln-po-reb') return "Уполномоченный по правам ребенка";
      if (pathname === '/info/polnomochiya-spikera' || pathname === '/info/polnomochiya-speaker' || pathname === '/info/speaker-powers') return "Полномочия Председателя";
      if (pathname === '/info/hural-powers' || pathname === '/about/polnomochiya') return "Полномочия Верховного Хурала";
      if (pathname === '/info/ombudsman') return "Уполномоченный по правах человека";
      if (pathname === '/info/child-rights') return "Уполномоченный по правах ребенка";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii') || pathname === '/info/anti-corruption') return "Противодействие коррупции";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/normativnye-akty')) return "Нормативные правовые акты";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/komissiya-deputatov')) return "Комиссия депутатов";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/komissiya-deputatov/vypiski-protokoly')) return "Выписки, протоколы, решения";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/komissiya-deputatov/informatsiya')) return "Информация о деятельности Комиссии";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/metodicheskie-materialy')) return "Методические материалы";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/obratnaya-svyaz')) return "Обратная связь";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/formy-dokumentov')) return "Формы документов";
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/spavki-bk')) return 'СПО "Справки БК"';
      if (pathname.startsWith('/info/protivodeystvie-korrupcii/protivodeystvie-korrupcii-plan')) return "План противодействия коррупции";
      if (pathname === '/info/contacts') return "Контактная информация";
      if (pathname === '/info/gosudarstvennye-simvoly' || pathname === '/info/symbols') return "Государственные символы Республики Тыва";
      if (pathname.startsWith('/info/prigranichny-subekt') || pathname.startsWith('/info/border-subekt') || pathname === '/info/border-subject') return "Приграничный субъект";
      if (pathname === '/info/prigranichny-subekt/shablony' || pathname === '/info/border-subject/shablony') return "Шаблоны заявлений";
      if (pathname === '/info/prigranichny-subekt/shema-uslugi') return "Схема предоставления услуги";
      if (pathname === '/info/prigranichny-subekt/individualny-propusk') return "Индивидуальный пропуск";
      if (pathname === '/info/prigranichny-subekt/kollektivny-propusk') return "Коллективный пропуск";
      if (pathname === '/info/prigranichny-subekt/zayavlenie-zakonnogo-predstavitelya') return "Заявление законного представителя";
      if (pathname === '/info/prigranichny-subekt/zayavlenie-individualny-propusk') return "Заявление на индивидуальный пропуск";
      if (pathname === '/info/prigranichny-subekt/zayavlenie-kollektivny-propusk') return "Заявление на коллективный пропуск";
      if (pathname === '/info/prigranichny-subekt/zayavlenie-promyslovaya-deyatelnost') return "Заявление на промысловую деятельность";
      if (pathname === '/info/prigranichny-subekt/zayavlenie-hoz-deyatelnost') return "Заявление на разрешение хоз. деятельности";
      // Названия страниц «Кадрового обеспечения» берём из данных раздела, а не хардкодом
      if (pathname === PERSONNEL_ROOT_PATH || pathname.startsWith(PERSONNEL_ROOT_PATH + "/")) {
        return getPersonnelPage(pathname.slice(1))?.title || PERSONNEL_TITLE;
      }
      if (pathname === '/info/polnomochiya') return "Полномочия";
      return "Общие сведения";
    }

    // Специфичные заголовки для раздела "Депутаты"
    if (detectedSection === 'deputies') {
      if (pathname === '/deputies/ended') return "Депутаты (завершившие полномочия)";
      const queryString = route?.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const convocation = params.get("convocation");
      const status = params.get("status");
      
      if (pathname === '/deputies') {
        if (status === 'ended') return "Депутаты прекратившие полномочия";
        if (status === 'active') return "Действующие депутаты";
        // Если явно выбраны "Все" созывы
        if (convocation === 'Все') return "Депутаты всех созывов";
        // Если выбран конкретный созыв (не Все и не пустой)
        if (convocation && convocation !== 'Все') {
          const convocationDecoded = decodeURIComponent(convocation);
          if (convocationDecoded === 'VIII') return "Депутаты VIII созыва";
          if (convocationDecoded === 'VII') return "Депутаты VII созыва";
          if (convocationDecoded === 'VI') return "Депутаты VI созыва";
          if (convocationDecoded === 'V') return "Депутаты V созыва";
          if (convocationDecoded === 'IV') return "Депутаты IV созыва";
          if (convocationDecoded === 'III') return "Депутаты III созыва";
          if (convocationDecoded === 'II') return "Депутаты II созыва";
          if (convocationDecoded === 'I') return "Депутаты I созыва";
        }
        // По умолчанию (без параметров) — просто "Депутаты"
      }
      return "Депутаты";
    }

    // Специфичные заголовки для раздела "Комитеты/Комиссии"
    if (detectedSection === 'committees' || detectedSection === 'commissions') {
      if (pathname.includes('/commission')) return "Комиссии";
      if (pathname.includes('/committee')) return "Комитеты";
      return "О Хурале";
    }

    // Специфичные заголовки для раздела "О Хурале" (about)
    if (detectedSection === 'about') {
      const queryString = route?.split("?")[1] || "";
      const params = new URLSearchParams(queryString);
      const focus = params.get("focus");
      const tab = params.get("tab");

      if (pathname === '/government') return "Руководство";
      if (pathname === '/struct/council') return "Представительство в Совете Федерации";
      if (pathname === '/youth-parliament') return "Молодежный Хурал";
      if (pathname === '/about/istoriya-parlamentarizma') return "История парламентаризма";
      
      // Проверяем query параметры для страницы /about
      if (pathname === '/about' || pathname === '/about/') {
        if (focus === 'committees') return "Комитеты";
        if (focus === 'commissions') return "Комиссии";
        if (focus === 'factions') return "Депутатские фракции";
        if (focus === 'overview') return "Структура парламента";
      }
      
      return "О Хурале";
    }

    // Специфичные заголовки для раздела "Документы"
    if (detectedSection === 'documents') {
      if (pathname === '/docs/laws') return "Законы Республики Тыва";
      if (pathname === '/docs/resolutions') return "Постановления ВХ РТ";
      if (pathname === '/docs/initiatives') return "Законодательные инициативы";
      if (pathname === '/docs/civic') return "Законодательная инициатива гражданами";
      if (pathname === '/docs/constitution') return "Реализация поправок в Конституцию РФ";
      if (pathname === '/docs/bills') return "Законопроекты";
      return "Документы";
    }

    if (detectedSection === 'broadcast') {
      return "Трансляция";
    }

    const titleMap = {
      news: "Новости",
      deputies: "Депутаты",
      documents: "Документы",
      about: "О Хурале",
      committees: "Комитеты",
      commissions: "Комиссии",
      activity: "Деятельность",
      contacts: "Контакты",
      appeals: "Обращения",
      common: "Общие сведения",
      youth: "Молодежный Хурал",
    };

    return titleMap[detectedSection] || "Новости";
  }, [detectedSection, route]);

  // Применяем перевод к autoTitle
  const titleText = title
    ? (typeof title === "string" ? t(title) : title)
    : t(autoTitle);

  // Загружаем страницы из админки, если loadPages = true
  React.useEffect(() => {
    if (!loadPages) return;
    let alive = true;
    const fetchPages = async () => {
      try {
        const res = await AboutApi.listPagesTree({ publishedOnly: true }).catch(() => []);
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

        if (alive) {
          // Фильтруем страницы по разделу, если указан
          const filtered = detectedSection ? filterPagesBySection(arr, detectedSection) : arr;
          const links = pagesToLinks(applyPagesOverridesToTree(filtered), locale);
          setPagesLinks(links);
        }
      } catch (err) {
        if (alive) setPagesLinks([]);
      }
    };
    fetchPages();

    // Слушаем событие перезагрузки страниц
    const onPagesReload = () => {
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

  // Мемоизируем pathname, search и hash
  // pathname нормализуем через алиасы slug, чтобы на алиасном URL
  // (/about/districts) подсвечивалась каноническая ссылка (/info/iokrug).
  const [pathname, search, hash] = React.useMemo(() => {
    const r = route || "/";
    const q = r.indexOf("?");
    const h = r.indexOf("#");

    // Извлекаем pathname
    const pathEnd = q === -1 ? (h === -1 ? r.length : h) : q;
    const path = normalizePathBySlugAliases(r.slice(0, pathEnd) || "/");

    // Извлекаем search
    let searchStr = "";
    if (q !== -1) {
      const searchStart = q;
      const searchEnd = h === -1 ? r.length : h;
      searchStr = r.slice(searchStart, searchEnd);
    }

    // Извлекаем hash
    let hashStr = "";
    if (h !== -1) {
      hashStr = r.slice(h);
    }

    return [path, searchStr, hashStr];
  }, [route]);

  // Мемоизируем ссылки: приоритет - overrideLinks, затем загруженные страницы + defaultLinks, затем defaultLinks
  const links = React.useMemo(() => {
    // Если переданы свои ссылки вручную, используем их
    if (Array.isArray(overrideLinks) && overrideLinks.length) return overrideLinks;

    // Определяем стандартные ссылки для текущего раздела
    // Для большинства разделов используем специфичные ссылки (без дублирования с "Общими сведениями")
    let sectionDefaultLinks = [];
    if (detectedSection === 'appeals') {
      sectionDefaultLinks = defaultLinksAppeals;
    } else if (detectedSection === 'news') {
      // Для раздела новостей - фиксированное меню (не зависит от загруженных страниц)
      sectionDefaultLinks = defaultLinksNews;
    } else if (detectedSection === 'broadcast') {
      // Для раздела трансляции - фиксированное меню (не зависит от загруженных страниц)
      sectionDefaultLinks = defaultLinksBroadcast;
    } else if (detectedSection === 'common') {
      // Только для раздела "Общие сведения" показываем ссылки на финансы и т.д.
      sectionDefaultLinks = defaultLinksCommon;
    } else if (detectedSection === 'deputies') {
      sectionDefaultLinks = defaultLinksDeputies;
    } else if (detectedSection === 'about') {
      sectionDefaultLinks = defaultLinksAbout;
    } else if (detectedSection === 'activity') {
      sectionDefaultLinks = defaultLinksActivity;
    } else if (detectedSection === 'committees') {
      sectionDefaultLinks = defaultLinksCommittees;
    }

    // Если загружаем страницы И это не раздел новостей/трансляций, добавляем их к стандартным ссылкам
    if (loadPages && pagesLinks.length > 0 && detectedSection !== 'news' && detectedSection !== 'broadcast') {
      // Добавляем загруженные страницы в начало списка
      return [...pagesLinks, ...sectionDefaultLinks];
    }

    // Иначе используем стандартные ссылки раздела (или пустой массив для разделов без специфичных ссылок)
    return sectionDefaultLinks;
  }, [overrideLinks, loadPages, pagesLinks, detectedSection]);

  // Ссылки для подстраниц раздела «Кадровое обеспечение»
  const personnelLinks = React.useMemo(() => {
    const pathname = route?.split("?")[0] || "";
    const isPersonnelSubPage = pathname.startsWith(PERSONNEL_ROOT_PATH + "/");
    return isPersonnelSubPage ? PERSONNEL_SIDE_NAV : [];
  }, [route]);

  // Итоговые ссылки: если это подстраница персонала, используем её ссылки
  const finalLinks = personnelLinks.length > 0 ? personnelLinks : links;

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
        {finalLinks.map((l, i) => {
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
                    hash={hash}
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
                      hash={hash}
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
              hash={hash}
              onClick={(e) => handleLinkClick(e, l.onClick)}
              t={t}
            />
          );
        })}
      </div>
    </aside>
  );
}
