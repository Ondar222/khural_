function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const PAGES_OVERRIDES_STORAGE_KEY = "khural_pages_overrides_v1";
export const PAGES_OVERRIDES_EVENT_NAME = "khural:pages-overrides-changed";

/**
 * Shape:
 * {
 *   byId: {
 *     [id: string]: {
 *       slug?: string,
 *       menuTitle?: string | null,
 *       submenuTitle?: string | null,
 *       updatedAt?: number
 *     }
 *   }
 * }
 */
export function readPagesOverrides() {
  if (typeof window === "undefined") return { byId: {} };
  const raw = window.localStorage?.getItem(PAGES_OVERRIDES_STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { byId: {} };
  const byId = parsed.byId && typeof parsed.byId === "object" ? parsed.byId : {};
  return { byId };
}

export function writePagesOverrides(next) {
  if (typeof window === "undefined") return;
  window.localStorage?.setItem(PAGES_OVERRIDES_STORAGE_KEY, JSON.stringify(next || { byId: {} }));
  window.dispatchEvent(new CustomEvent(PAGES_OVERRIDES_EVENT_NAME));
}

export function upsertPageOverride({ id, slug, menuTitle, submenuTitle }) {
  if (!id) return;
  const prev = readPagesOverrides();
  const byId = { ...(prev.byId || {}) };
  byId[String(id)] = {
    ...(byId[String(id)] || {}),
    ...(slug !== undefined ? { slug: String(slug || "") } : {}),
    ...(menuTitle !== undefined ? { menuTitle: menuTitle ?? null } : {}),
    ...(submenuTitle !== undefined ? { submenuTitle: submenuTitle ?? null } : {}),
    updatedAt: Date.now(),
  };
  writePagesOverrides({ byId });
}

export function getPageOverrideById(id) {
  if (!id) return null;
  const o = readPagesOverrides();
  return (o.byId || {})[String(id)] || null;
}

/** Пустая подпись или заглушка вроде «—» не считается названием пункта меню. */
function normalizeMenuTitle(value) {
  const text = String(value ?? "").trim();
  return /^[—–-]+$/.test(text) ? "" : text;
}

/** Приводит подпись к виду для сравнения («Моя страничка» == «моя  страничка»). */
function normalizeTitleForCompare(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Возвращает подпись пункта меню вместе с признаком того, взята ли она из
 * уже локализованного контента. Для нелокализованных подписей Header/SideNav
 * могут включить автоматический перевод при переключении языка.
 */
export function pickMenuLabelInfo(page, locale, { prefer = "menu" } = {}) {
  // prefer: "menu" | "submenu"
  const id = page?.id;
  const override = id ? getPageOverrideById(id) : null;
  const wantSub = prefer === "submenu";
  const fromOverride = wantSub ? override?.submenuTitle : override?.menuTitle;
  const overrideTitle = normalizeMenuTitle(fromOverride);
  if (overrideTitle) {
    return { label: overrideTitle, localized: false, source: "override" };
  }

  // Fallback: localized title from content array when available
  const want = String(locale || "").toLowerCase();
  const c = page?.content;
  if (Array.isArray(c) && c.length) {
    const match = want ? c.find((x) => String(x?.locale || "").toLowerCase() === want) : null;
    const localizedTitle = normalizeMenuTitle(match?.title);
    if (localizedTitle) {
      // У новых страниц бэкенд/админка иногда создаёт локаль tyv с русским же
      // заголовком. Такую «локализацию» нельзя считать переводом: иначе на
      // тувинской версии сайта в меню остаётся русский текст.
      const ruEntry =
        c.find((x) => String(x?.locale || "").toLowerCase() === "ru") || null;
      const sourceTitle = normalizeMenuTitle(ruEntry?.title || page?.title || page?.name);
      const looksLikeCopyOfSource =
        want === "tyv" &&
        sourceTitle &&
        normalizeTitleForCompare(localizedTitle) === normalizeTitleForCompare(sourceTitle);

      if (!looksLikeCopyOfSource) {
        return { label: localizedTitle, localized: true, source: "content" };
      }
    }
    const fallbackTitle = normalizeMenuTitle(c[0]?.title);
    if (fallbackTitle) {
      return { label: fallbackTitle, localized: false, source: "content-fallback" };
    }
  }

  return {
    label: normalizeMenuTitle(page?.title || page?.name || page?.slug),
    localized: false,
    source: "page",
  };
}

export function pickMenuLabel(page, locale, options = {}) {
  return pickMenuLabelInfo(page, locale, options).label;
}

export function applyPagesOverridesToTree(tree) {
  const list = Array.isArray(tree) ? tree : [];
  const byId = readPagesOverrides().byId || {};
  const applyOne = (p) => {
    if (!p) return p;
    const id = String(p?.id ?? "");
    const ov = id ? byId[id] : null;
    const next = ov ? { ...p, __menuTitle: ov.menuTitle ?? null, __submenuTitle: ov.submenuTitle ?? null } : { ...p };
    if (Array.isArray(next.children)) {
      next.children = next.children.map(applyOne);
    }
    return next;
  };
  return list.map(applyOne);
}

