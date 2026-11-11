/** Автоопределение категории новости по тексту.
 * Если у поста категория не задана или стоит общая «Новости» —
 * подбираем категорию по ключевым словам заголовка и описания.
 */

// Общая (нераскрывающая) категория — считаем, что категория не задана
const GENERIC_CATEGORIES = ["новости", "news", "без категории", "разное", "прочее"];

// Правила: категория <- ключевые слова (встречаются в title/excerpt/content).
// Порядок важен: первая совпавшая категория выигрывает.
const CATEGORY_RULES = [
  {
    category: "Новости Председателя",
    keywords: [
      "председатель верховного хурала",
      "председателя верховного хурала",
      "даваа каан-оол",
      "председатель хурала",
    ],
  },
  {
    category: "Заседания",
    keywords: [
      "заседание",
      "заседания",
      "сессия",
      "сессии",
      "повестка",
      "парламентский час",
      "правительственный час",
      "открытая трибуна",
    ],
  },
  {
    category: "Законодательство",
    keywords: [
      "законопроект",
      "законопроекты",
      "закон о",
      "закона о",
      "законов",
      "поправки",
      "изменения в законодательство",
      "нормативный правовой акт",
      "законотвор",
      "кодекс",
      "публичные слушания",
      "правовой мониторинг",
    ],
  },
  {
    category: "Комитеты",
    keywords: [
      "комитет",
      "комитета",
      "комитеты",
      "рабочая группа",
      "рабочей группы",
      "подкомитет",
    ],
  },
  {
    category: "Работа с гражданами",
    keywords: [
      "прием граждан",
      "приём граждан",
      "обращения граждан",
      "встреча с избирателями",
      "избиратели",
      "избирателей",
      "выездной прием",
      "выездной приём",
      "личн",
    ],
  },
  {
    category: "Общественные мероприятия",
    keywords: [
      "обществен",
      "форум",
      "конференция",
      "круглый стол",
      "митаинг",
      "акция",
      "праздник",
      "концерт",
      "выставка",
      "юбилей",
      "ветеран",
    ],
  },
  {
    category: "Молодежная политика",
    keywords: [
      "молодеж",
      "молодёж",
      "студент",
      "школьн",
      "молодежный парламент",
      "молодёжный парламент",
    ],
  },
  {
    category: "Международные связи",
    keywords: [
      "междунар",
      "делегация",
      "монголия",
      "дружествен",
      "межпарламент",
      "совет федерации",
      "государственная дума",
      "межрегиона",
      "субъектов рф",
    ],
  },
  {
    category: "Награды и звания",
    keywords: [
      "награжд",
      "почетн",
      "почётн",
      "грамот",
      "орден",
      "медаль",
      "звание",
      "премия",
    ],
  },
  {
    category: "Фракции",
    keywords: ["фракци", "единая россия", "кпрф", "лдпр", "новые люди", "справедливая россия"],
  },
  {
    category: "Аппарат",
    keywords: ["аппарат верховного хурала", "аппарата верховного хурала", "сотрудник аппарата"],
  },
];

function stripHtml(s) {
  return String(s || "").replace(/<[^>]*>/g, " ");
}

function normalizeText(s) {
  return stripHtml(s).toLowerCase().replace(/\s+/g, " ");
}

/** Категория ли это «общая» (не несёт смысла)? */
export function isGenericCategory(category) {
  const label =
    typeof category === "string"
      ? category
      : String(category?.name || category?.title || "").trim();
  const norm = normalizeText(label);
  if (!norm) return true;
  return GENERIC_CATEGORIES.includes(norm);
}

/** Подбирает категорию по тексту новости. Возвращает строку или "". */
export function inferCategoryFromText(text) {
  const norm = normalizeText(text);
  if (!norm) return "";
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => norm.includes(kw))) {
      return rule.category;
    }
  }
  return "";
}

/**
 * Итоговая категория новости: своя (если не общая) или определённая по тексту.
 * @param {{title?: string, excerpt?: string, contentHtml?: string, category?: string | {name?: string, title?: string}}} item
 * @returns {{label: string, inferred: boolean}}
 */
export function resolveNewsCategory(item) {
  if (!item) return { label: "", inferred: false };
  const own =
    typeof item.category === "string"
      ? item.category.trim()
      : String(item.category?.name || item.category?.title || "").trim();
  if (own && !isGenericCategory(own)) return { label: own, inferred: false };
  const text = `${item.title || ""} ${item.excerpt || ""} ${item.contentHtml || ""}`;
  const inferred = inferCategoryFromText(text);
  return { label: inferred || own || "", inferred: Boolean(inferred) };
}
