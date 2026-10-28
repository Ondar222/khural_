// Единый источник алиасов slug → канонический slug раздела.
// Используется и страницей (PageBySlug), и боковым меню (SideNav), чтобы
// алиасный URL (например /about/districts) давал тот же контент и то же меню,
// что и канонический (/info/iokrug).
export const SLUG_ALIASES = {
  // Противодействие коррупции
  "info/anti-corruption": "info/protivodeystvie-korrupcii",
  // Приграничный субъект
  "info/border-subject": "info/prigranichny-subekt",
  // Полномочия Верховного Хурала
  "info/hural-powers": "about/polnomochiya",
  // Полномочия Председателя
  "info/polnomochiya-speaker": "info/polnomochiya-spikera",
  // Уполномоченный по правам человека
  "info/ombudsman": "info/upoln-po-prav",
  // Уполномоченный по правам ребенка
  "info/child-rights": "info/upoln-po-reb",
  // Государственные символы
  "info/symbols": "info/gosudarstvennye-simvoly",
  // Избирательные округа (алиас: /about/districts → /info/iokrug)
  "about/districts": "info/iokrug",
};

export function normalizeSlugAlias(slug) {
  if (!slug) return slug;
  const trimmed = String(slug).replace(/^\/+|\/+$/g, "");
  const segments = trimmed.split("/");
  const parentKey = segments.slice(0, 2).join("/");
  const parentCanonical = SLUG_ALIASES[parentKey];
  if (parentCanonical) {
    const rest = segments.slice(2).join("/");
    return rest ? `${parentCanonical}/${rest}` : parentCanonical;
  }
  return trimmed;
}

/** Путь → нормализованный путь (через алиасы slug). "/about/districts" → "/info/iokrug" */
export function normalizePathBySlugAliases(pathname) {
  const path = String(pathname || "/");
  const normalized = normalizeSlugAlias(path);
  // normalizeSlugAlias снимает ведущий слэш — возвращаем его обратно
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
