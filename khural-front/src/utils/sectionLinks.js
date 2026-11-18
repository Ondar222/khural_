/**
 * Понятные адреса страниц разделов.
 *
 * Вместо /section?title=%D0%A1%D1%82%D1%80%D1%83%D0%BA%D1%82%D1%83%D1%80%D0%B0...
 * ссылки выглядят как /section/struktura-apparata.
 *
 * Преобразование обратимое: заголовок транслитерируется в латиницу, пробелы
 * заменяются на дефисы. Точное восстановление заголовка обеспечивают реестр
 * (заполняется при создании ссылок) и список известных заголовков сайта;
 * обратная транслитерация используется как запасной вариант для прямых URL.
 */

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// Более длинные последовательности должны проверяться первыми (sch до sh и т.д.).
const REVERSE_TRANSLIT = Object.entries(TRANSLIT)
  .filter(([cyr]) => cyr)
  .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ru"));

// Заголовки, которые встречаются в меню/контенте чаще всего. Они гарантируют
// точный переход со старых закладок и прямых ссылок без ранее созданного реестра.
const KNOWN_TITLES = [
  "Структура Аппарата",
  "Аппарат",
  "Руководитель Аппарата",
  "Заместитель Руководителя Аппарата",
  "Первый помощник Председателя",
  "Помощник Председателя",
  "Помощник заместителя Председателя",
  "Организационное управление",
  "Информационно-аналитическое управление",
  "Государственно-правовое управление",
  "Управление делами",
  "Управление финансов, бухгалтерского учета и отчетности",
  "Отдел технического и программного обеспечения",
  "Отдел кадров и государственной службы",
  "Структура Верховного Хурала (парламента) Республики Тыва",
  "Руководство парламента",
  "Руководство Верховного Хурала (парламента) Республики Тыва",
  "Комиссии",
  "Комитеты",
  "Депутатские фракции",
  "Фракции в Верховном Хурале",
  "Представительство в Совете Федерации",
  "Молодежный Хурал",
  "Отчеты комитетов",
  "Отчеты комитетов 3 созыва",
  "Отчеты комитетов 4 созыва",
  "Повестки комитетов",
  "Отчеты всех Созывов",
  "Совет по взаимодействию с представительными органами муниципальных образований",
  "Постановление",
  "Положение о Совете",
  "Президиум Совета",
  "Структура Совета Хуралов",
  "Персональный состав ГРУПП",
  "Повестки заседаний Совета",
];

const slugToTitleRegistry = new Map();

function toSlug(title) {
  return String(title || "")
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fromSlug(slug) {
  const text = String(slug || "").replace(/-+/g, " ").trim();
  if (!text) return "";
  let result = "";
  for (let i = 0; i < text.length; ) {
    let matched = false;
    for (const [latin, cyrillic] of REVERSE_TRANSLIT) {
      if (text.startsWith(latin, i)) {
        result += cyrillic;
        i += latin.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
      i += 1;
    }
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/** Возвращает понятный slug для заголовка раздела. */
export function sectionSlug(title) {
  return toSlug(title);
}

/**
 * Строит понятную ссылку на страницу раздела.
 * Дополнительные параметры (например, { person: 1 }) добавляются в query.
 */
export function sectionHref(title, params) {
  const clean = String(title || "").trim();
  const slug = toSlug(clean);
  if (!slug) return "/section";
  slugToTitleRegistry.set(slug, clean);

  let href = `/section/${slug}`;
  if (params && typeof params === "object") {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value != null && value !== "") search.set(key, String(value));
    }
    const query = search.toString();
    if (query) href += `?${query}`;
  } else if (typeof params === "string" && params) {
    href += params.startsWith("?") ? params : `?${params}`;
  }
  return href;
}

/** Восстанавливает заголовок раздела по понятному slug. */
export function resolveSectionTitle(slug) {
  const raw = String(slug || "").trim();
  if (!raw) return "";
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // оставляем как есть
  }
  if (slugToTitleRegistry.has(decoded)) return slugToTitleRegistry.get(decoded);
  const known = KNOWN_TITLES.find((title) => toSlug(title) === decoded);
  if (known) return known;
  return fromSlug(decoded);
}
