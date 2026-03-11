/** Общий список пунктов меню раздела «Новости» для шапки (dropdown) и бокового меню (NewsArchive).
 * Чтобы выпадающее меню и пункты в сайдбаре совпадали.
 */

/** Дополнительные ссылки раздела «Новости» (страницы и трансляции) — в конце меню */
export const NEWS_EXTRA_LINKS = [
  { labelRu: "Кодекс чести мужчины Тувы", href: "/code-of-honor" },
  { labelRu: "Свод заповедей матерей Тувы", href: "/mothers-commandments" },
  { labelRu: "Для СМИ", href: "/for-media" },
  { labelKey: "Трансляции", href: "/broadcast" },
];

/**
 * Извлекает список категорий новостей из массива новостей (как в Header).
 * @param {Array} news
 * @returns {string[]}
 */
export function getNewsCategoriesFromNews(news) {
  const cats = Array.from(
    new Set(
      (news || []).map((n) => {
        const c = n?.category;
        if (typeof c === "string") return c;
        if (!c) return "";
        return c.name || c.title || String(c);
      })
    )
  ).filter((c) => typeof c === "string" && c.trim() !== "");
  return cats;
}

/**
 * Порядок пунктов меню «Новости»: сначала фиксированные, потом разделитель, потом категории из API.
 * Совпадает с порядком в Header (newsCategories).
 */
export const NEWS_MENU_FIRST = ["Актуальные новости", "Все новости", "Медиа"];
