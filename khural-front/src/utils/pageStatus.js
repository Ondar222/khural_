/** Три состояния страницы в административном интерфейсе. */
export const PAGE_STATUS_OPTIONS = [
  { value: "draft", label: "Черновик", color: "default" },
  { value: "published", label: "Опубликована", color: "green" },
  { value: "unpublished", label: "Снята с публикации", color: "orange" },
];

/** Приводит страницу к одному из трёх статусов (для старых записей без поля status). */
export function pageStatusOf(page) {
  if (page?.status && PAGE_STATUS_OPTIONS.some((option) => option.value === page.status)) {
    return page.status;
  }
  if (page?.isPublished) return "published";
  if (page?.publishedAt) return "unpublished";
  return "draft";
}

export function pageStatusOption(status) {
  return PAGE_STATUS_OPTIONS.find((option) => option.value === status) || PAGE_STATUS_OPTIONS[0];
}
