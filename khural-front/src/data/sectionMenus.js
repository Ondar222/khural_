import { PERSONNEL_ROOT_PATH } from "../content/personnel.js";

const MUNICIPAL_COUNCIL_TITLE =
  "Совет по взаимодействию с представительными органами муниципальных образований";

const sectionHref = (title) => `/section?title=${encodeURIComponent(title)}`;

/**
 * Состав раздела «О Верховном Хурале».
 * Повторяет подразделы старого сайта из раздела «Общие сведения»
 * (https://khural.rtyva.ru/info/), но ссылки ведут на страницы нового сайта.
 */
export const ABOUT_SECTION_LINKS = [
  { label: "История парламентаризма в Туве", href: "/about/istoriya-parlamentarizma" },
  { label: "Полномочия Верховного Хурала", href: "/about/polnomochiya" },
  { label: "Полномочия Председателя", href: "/info/polnomochiya-spikera" },
  { label: "Кадровое обеспечение", href: PERSONNEL_ROOT_PATH },
  { label: "Противодействие коррупции", href: "/info/protivodeystvie-korrupcii" },
  { label: "Контактная информация", href: "/info/contacts" },
  {
    label: "Уполномоченный по правам человека в Республике Тыва",
    href: "/info/upoln-po-prav",
  },
  {
    label: "Уполномоченный по правам ребенка в Республике Тыва",
    href: "/info/upoln-po-reb",
  },
  { label: "Избирательные округа", href: "/info/iokrug" },
  { label: "Финансы", href: "/about/finances" },
  { label: "Государственные символы", href: "/info/gosudarstvennye-simvoly" },
  { label: "Приграничный субъект", href: "/info/prigranichny-subekt" },
  { label: "Законодательная карта сайта", href: "/info/zakon-karta" },
  { label: "Открытые данные", href: "/opendata" },
  { label: "Кодекс чести мужчины Тувы", href: "/code-of-honor" },
  { label: "Свод заповедей матерей Тувы", href: "/mothers-commandments" },
];

/**
 * Состав раздела «Структура».
 * Повторяет подразделы старого сайта из раздела «Структура»
 * (https://khural.rtyva.ru/struct/).
 */
export const STRUCTURE_SECTION_LINKS = [
  { label: "Руководство", href: "/government" },
  { label: "Депутаты", href: "/deputies" },
  {
    label: "Депутаты всех созывов",
    href: "/deputies?status=all&convocation=%D0%92%D1%81%D0%B5",
  },
  { label: "Представительство в Совете Федерации", href: "/struct/council" },
  { label: "Депутатские фракции", href: sectionHref("Депутатские фракции") },
  { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
  { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
  { label: MUNICIPAL_COUNCIL_TITLE, href: sectionHref(MUNICIPAL_COUNCIL_TITLE) },
  { label: "Аппарат", href: "/apparatus" },
  { label: "Молодежный Хурал", href: "/youth-parliament" },
];

/** Ссылки на депутатов по созывам — общие для Header (desktop/mega/mobile) и бокового меню. */
export const DEPUTY_CONVOCATION_LINKS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map(
  (convocation) => ({
    label: `Депутаты ${convocation} созыва`,
    href: `/deputies?convocation=${encodeURIComponent(convocation)}`,
  })
);

/** Все статические href разделов — чтобы CMS-ссылки не дублировали их. */
export const ABOUT_SECTION_HREFS = ABOUT_SECTION_LINKS.map((link) => link.href);
export const STRUCTURE_SECTION_HREFS = STRUCTURE_SECTION_LINKS.map((link) => link.href);
export const DEPUTY_CONVOCATION_HREFS = DEPUTY_CONVOCATION_LINKS.map((link) => link.href);

/**
 * Разделы верхнего меню сайта. Используются в админке как «Родитель» страницы:
 * это страницы/разделы шапки, а не подпункты выпадающих меню.
 * `aliases` нужны, чтобы уже существующие страницы (например, info/* или struct/*)
 * корректно определяли свой родительский раздел.
 */
export const HEADER_PARENT_SECTIONS = [
  { value: "about", label: "Общие сведения", slugPrefix: "about", aliases: ["about", "info"] },
  { value: "structure", label: "Структура", slugPrefix: "struct", aliases: ["structure", "struct"] },
  { value: "deputies", label: "Депутаты", slugPrefix: "deputies", aliases: ["deputies"] },
  { value: "documents", label: "Документы", slugPrefix: "docs", aliases: ["documents", "docs"] },
  { value: "news", label: "Новости", slugPrefix: "news", aliases: ["news"] },
  { value: "appeals", label: "Обращения граждан", slugPrefix: "appeals", aliases: ["appeals"] },
];

/** Находит раздел шапки, которому принадлежит страница по её адресу. */
export function getHeaderSectionForSlug(slug) {
  const clean = String(slug || "").replace(/^\/+|\/+$/g, "");
  if (!clean) return null;
  return (
    HEADER_PARENT_SECTIONS.find((section) =>
      section.aliases.some((alias) => clean === alias || clean.startsWith(`${alias}/`))
    ) || null
  );
}
