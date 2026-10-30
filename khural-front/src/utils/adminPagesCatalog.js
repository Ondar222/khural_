// Real site routes. These are NOT CMS pages.
// Editing is done via corresponding admin modules (news/deputies/documents/slider/etc).
export const SYSTEM_ROUTE_DEFS = [
  {
    route: "/",
    title: "Главная",
    adminLinks: [
      { label: "Слайдер", href: "/admin/slider" },
      { label: "Новости", href: "/admin/news" },
      { label: "События", href: "/admin/events" },
    ],
  },
  { route: "/news", title: "Новости", adminLinks: [{ label: "Новости", href: "/admin/news" }] },
  { route: "/deputies", title: "Депутаты", adminLinks: [{ label: "Депутаты", href: "/admin/deputies" }] },
  { route: "/documents", title: "Документы", adminLinks: [{ label: "Документы", href: "/admin/documents" }] },
  { route: "/contacts", title: "Контакты", adminLinks: [] },
  { route: "/about", title: "О Хурале", adminLinks: [{ label: "Структура", href: "/admin/committees" }] },
];

export const STATIC_SECTIONS = [
  { slug: "news", title: "Новости" },
  { slug: "deputies", title: "Депутаты" },
  { slug: "documents", title: "Документы" },
  { slug: "about", title: "О Хурале" },
  { slug: "committees", title: "Комитеты" },
  { slug: "commissions", title: "Комиссии" },
  { slug: "activity", title: "Деятельность" },
  { slug: "contacts", title: "Контакты" },
  { slug: "appeals", title: "Обращения" },
  { slug: "broadcast", title: "Трансляция" },
];

export const FIXED_CONTENT_PAGES = [
  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы" },
  { slug: "struct/council", title: "Представительство в Совете Федерации" },
  { slug: "info/finansy", title: "Финансы" },
  { slug: "info/iokrug", title: "Избирательные округа" },
  { slug: "info/zakon-karta", title: "Законодательная карта сайта" },
  { slug: "opendata", title: "Открытые данные" },
  { slug: "info/upoln-po-prav", title: "Уполномоченный по правам человека в Республике Тыва" },
  { slug: "info/upoln-po-reb", title: "Уполномоченный по правам ребенка в Республике Тыва" },
  { slug: "info/personnel", title: "Кадровое обеспечение" },
];

export function countAdminPageRows(cmsPages) {
  const pages = Array.isArray(cmsPages) ? cmsPages : [];
  const slugs = new Set(pages.map((page) => String(page?.slug || "").replace(/^\/+|\/+$/g, "")));
  const fixedPagesNotInApi = FIXED_CONTENT_PAGES.filter((page) => !slugs.has(page.slug)).length;
  return pages.length + SYSTEM_ROUTE_DEFS.length + STATIC_SECTIONS.length + fixedPagesNotInApi;
}
