import { MenuApi } from "../api/client.js";
import { HEADER_PARENT_SECTIONS } from "../data/sectionMenus.js";
import { notifySiteUpdated } from "./siteUpdates.js";

/**
 * Общая логика связи «Родитель» из /admin/pages с меню шапки.
 *
 * Родитель в редакторе страниц — это раздел верхнего меню (О Верховном
 * Хурале, Структура, Депутаты, ...). Чтобы опубликованная подстраница
 * действительно появлялась в выпадающем списке, мало записать префикс в slug:
 * если на сайте включён меню из /api/menu, шапка берёт пункты только оттуда.
 * Поэтому после сохранения страницы создаём/обновляем пункт меню с pageId,
 * а саму страницу всё равно добавляем в меню и на стороне Header (fallback).
 */

const SECTION_HINTS = {
  about: {
    paths: ["/about", "/info"],
    labels: ["О Верховном Хурале", "Верховный Хурал", "Верховный Хурал Республики Тыва"],
  },
  structure: {
    paths: ["/section", "/struct", "/government"],
    labels: ["Структура"],
  },
  deputies: {
    paths: ["/deputies"],
    labels: ["Депутаты"],
  },
  documents: {
    paths: ["/docs", "/docs/laws", "/documents"],
    labels: ["Документы"],
  },
  news: {
    paths: ["/news"],
    labels: ["Новости"],
  },
  appeals: {
    paths: ["/appeals"],
    labels: ["Обращения граждан", "Обращения"],
  },
};

function normalizeName(value) {
  return String(value ?? "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanSlug(value) {
  return String(value ?? "").trim().replace(/^\/+|\/+$/g, "");
}

export function normalizeMenuPath(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    return new URL(raw, "http://localhost").pathname.replace(/\/+$/, "") || "/";
  } catch {
    return raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  }
}

/** URL пункта меню в том виде, в котором его использует пуб-шапка. */
export function getMenuItemHref(item) {
  if (item?.url) return String(item.url);
  const slug = cleanSlug(item?.pageSlug ?? item?.slug ?? item?.page?.slug);
  if (!slug) return "";
  const parts = slug.split("/").filter(Boolean);
  return parts.length > 1 ? `/${parts.join("/")}` : `/p/${slug}`;
}

/** Адрес CMS-страницы: "/about/foo" для вложенных и "/p/foo" для корневых. */
export function getPageHref(slug) {
  const parts = cleanSlug(slug)
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part));
  if (!parts.length) return "";
  return parts.length > 1 ? `/${parts.join("/")}` : `/p/${parts[0]}`;
}

export function flattenMenuItems(items) {
  const out = [];
  const visit = (nodes) => {
    for (const item of Array.isArray(nodes) ? nodes : []) {
      if (!item) continue;
      out.push(item);
      visit(item.children);
    }
  };
  visit(items);
  return out;
}

function normalizeMenuList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.menu)) return res.menu;
  return [];
}

/** Находит раздел шапки по value или по префиксу slug. */
export function resolveHeaderSection(valueOrSlug) {
  const clean = cleanSlug(valueOrSlug).toLowerCase();
  if (!clean) return null;
  return (
    HEADER_PARENT_SECTIONS.find((section) => section.value === clean) ||
    HEADER_PARENT_SECTIONS.find((section) =>
      section.aliases.some((alias) => clean === alias || clean.startsWith(`${alias}/`))
    ) ||
    null
  );
}

/** Все префиксы slug, которые относятся к разделу (about + info, struct + structure). */
export function getSectionAliases(sectionValue) {
  const section = HEADER_PARENT_SECTIONS.find((s) => s.value === sectionValue);
  return section ? [...section.aliases] : [];
}

/** Признак корневого пункта меню, соответствующего разделу шапки. */
export function isSectionRootItem(item, sectionValue) {
  const section = HEADER_PARENT_SECTIONS.find((s) => s.value === sectionValue);
  const hint = SECTION_HINTS[sectionValue];
  if (!section || !item) return false;

  const path = normalizeMenuPath(getMenuItemHref(item));
  if (hint.paths.some((candidate) => normalizeMenuPath(candidate) === path)) return true;

  const slugs = [item.pageSlug, item.slug, item.page?.slug]
    .map(cleanSlug)
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  if (slugs.some((slug) => section.aliases.includes(slug))) return true;

  const labels = [item.title, item.titleRu, item.titleTyv, item.titleTy, item.label]
    .map(normalizeName)
    .filter(Boolean);
  const expected = hint.labels.map(normalizeName);
  // Название раздела может быть чуть длиннее эталона, но только у корневого
  // пункта: подстраница «Полномочия Верховного Хурала» не должна считаться
  // самим разделом, иначе её пункт меню никогда не обновится.
  const isRootLevel = !item.parentId && !item.groupId;
  return isRootLevel && labels.some((label) =>
    expected.some((candidate) => label === candidate || label.startsWith(candidate))
  );
}

export function findHeaderMenuRoot(items, sectionValue) {
  const flat = flattenMenuItems(items);
  return (
    flat.find((item) => !item.parentId && isSectionRootItem(item, sectionValue)) ||
    flat.find((item) => isSectionRootItem(item, sectionValue)) ||
    null
  );
}

function isAnySectionRoot(item) {
  return HEADER_PARENT_SECTIONS.some((section) => isSectionRootItem(item, section.value));
}

/** id страницы-раздела, если она есть в CMS; иначе root остаётся статическим разделом. */
export function resolveHeaderParentId(sectionValue, pages) {
  const section = HEADER_PARENT_SECTIONS.find((s) => s.value === sectionValue);
  if (!section) return null;
  const match = (Array.isArray(pages) ? pages : []).find((page) => {
    const slug = cleanSlug(page?.slug).toLowerCase();
    return slug && section.aliases.some((alias) => alias === slug);
  });
  return match?.id ?? null;
}

function findLinkedMenuItem(items, page, slug) {
  const flat = flattenMenuItems(items);
  const id = cleanSlug(page?.id);
  // previousSlug нужен при переносе страницы в другой раздел: пункт меню ещё
  // висит на старом адресе, а новый slug уже другой.
  const pageSlugs = [slug, page?.slug, page?.previousSlug, page?.pageSlug]
    .map(cleanSlug)
    .filter(Boolean)
    .map((value) => value.toLowerCase());
  const hrefs = [slug, page?.slug, page?.previousSlug]
    .map(getPageHref)
    .filter(Boolean)
    .map(normalizeMenuPath);

  if (id) {
    const byId = flat.find((item) => cleanSlug(item?.pageId) === id);
    if (byId) return byId;
  }
  const bySlug = flat.find((item) =>
    [item?.pageSlug, item?.slug].map(cleanSlug).some((value) => value && pageSlugs.includes(value.toLowerCase()))
  );
  if (bySlug) return bySlug;
  return (
    flat.find((item) => {
      const href = normalizeMenuPath(getMenuItemHref(item));
      return href && hrefs.includes(href);
    }) || null
  );
}

function isPublishedPage(page, explicit) {
  if (typeof explicit === "boolean") return explicit;
  const status = String(page?.status ?? "").trim().toLowerCase();
  if (status) return status === "published";
  if (page?.isPublished === true || page?.isPublished === "true" || page?.isPublished === 1) return true;
  return Boolean(page?.publishedAt);
}

function buildMenuPayload({ rootId, page, slug, titleRu, titleTyv, order }) {
  const finalSlug = cleanSlug(slug || page?.slug);
  const finalTitle = String(titleRu || page?.title || page?.name || finalSlug || "Страница").trim();
  return {
    area: "header",
    parentId: rootId,
    groupId: null,
    pageId: page?.id ?? null,
    url: getPageHref(finalSlug) || null,
    titleRu: finalTitle,
    titleTyv: String(titleTyv || "").trim() || finalTitle,
    order: Number(order || 0),
    isVisible: true,
  };
}

async function loadHeaderMenu() {
  return normalizeMenuList(
    await MenuApi.list({ area: "header", tree: false, includeHidden: true })
  );
}

/**
 * Создаёт/обновляет пункт подменю для страницы. Если раздел в /api/menu не
 * найден — ничего не делаем: Header сам добавит CMS-страницу в статическое
 * подменю. Ошибки API меню не должны ломать сохранение страницы.
 */
export async function syncPageHeaderMenu({
  page,
  slug,
  sectionValue,
  titleRu,
  titleTyv,
  isPublished,
} = {}) {
  if (typeof window === "undefined") return false;
  // Пустая строка — это осознанный выбор «Без родителя» в админке.
  const sectionInput =
    sectionValue === undefined || sectionValue === null ? slug || page?.slug : sectionValue;
  const section = resolveHeaderSection(sectionInput);
  const finalSlug = cleanSlug(slug || page?.slug);
  const linkedSlug = section ? finalSlug : "";

  let items;
  try {
    items = await loadHeaderMenu();
  } catch {
    return false;
  }

  // Не трогаем корневые пункты разделов: это сами разделы шапки, а не
  // подстраницы, которые должен создавать редактор /admin/pages.
  const linkedCandidate = findLinkedMenuItem(items, page, linkedSlug);
  const linked = linkedCandidate && !isAnySectionRoot(linkedCandidate) ? linkedCandidate : null;

  // Родитель не выбран или страница снята с публикации — пункт меню не нужен.
  if (!section || !isPublishedPage(page, isPublished)) {
    if (linked) {
      try {
        await MenuApi.remove(linked.id);
        notifySiteUpdated("menu");
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  const root = findHeaderMenuRoot(items, section.value);
  if (!root) return false;

  const siblings = items.filter(
    (item) => String(item?.parentId ?? "") === String(root.id) && !item?.groupId
  );
  const maxOrder = siblings.reduce(
    (acc, item) => Math.max(acc, Number(item?.order || 0)),
    -1
  );
  const payload = buildMenuPayload({
    rootId: root.id,
    page: { ...(page || {}), id: page?.id ?? null },
    slug: finalSlug,
    titleRu,
    titleTyv,
    order:
      linked && String(linked.parentId ?? "") === String(root.id)
        ? linked?.order ?? maxOrder + 1
        : maxOrder + 1,
  });

  try {
    if (linked) await MenuApi.update(linked.id, payload);
    else await MenuApi.create(payload);
    notifySiteUpdated("menu");
    return true;
  } catch {
    return false;
  }
}

/** Удаляет связанный пункт меню при удалении страницы. */
export async function removePageHeaderMenu({ page, slug } = {}) {
  if (typeof window === "undefined") return false;
  let items;
  try {
    items = await loadHeaderMenu();
  } catch {
    return false;
  }
  const linked = findLinkedMenuItem(items, page, slug || page?.slug);
  if (!linked || isAnySectionRoot(linked)) return false;
  try {
    await MenuApi.remove(linked.id);
    notifySiteUpdated("menu");
    return true;
  } catch {
    return false;
  }
}
