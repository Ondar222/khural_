import { COMMISSION_PAGE_SLUG_PREFIX } from "./commissionPages.js";

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

export function countAdminPageRows(cmsPages) {
  const pages = Array.isArray(cmsPages) ? cmsPages : [];
  return pages.filter((page) => !String(page?.slug || "").startsWith(COMMISSION_PAGE_SLUG_PREFIX)).length
    + SYSTEM_ROUTE_DEFS.length
    + STATIC_SECTIONS.length;
}
