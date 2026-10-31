export const COMMISSION_PAGE_SLUG_PREFIX = "commission-data-";
const COMMISSION_PAGE_TYPE = "khural-commission";

export function commissionPageSlug(id) {
  const safeId = String(id ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!safeId) throw new Error("Не удалось сформировать ID страницы комиссии");
  return `${COMMISSION_PAGE_SLUG_PREFIX}${safeId}`;
}

function getPageContent(page) {
  const content = page?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const item = content.find((entry) => String(entry?.locale || "").toLowerCase() === "ru") || content[0];
    return typeof item?.content === "string" ? item.content : "";
  }
  return "";
}

export function readCommissionPage(page) {
  const slug = String(page?.slug || "");
  if (!slug.startsWith(COMMISSION_PAGE_SLUG_PREFIX)) return null;

  let stored;
  try {
    stored = JSON.parse(getPageContent(page));
  } catch {
    return null;
  }
  if (stored?.type !== COMMISSION_PAGE_TYPE || stored?.version !== 1) return null;

  const id = String(stored.id || slug.slice(COMMISSION_PAGE_SLUG_PREFIX.length));
  return {
    ...stored.commission,
    id,
    name: String(stored.commission?.name || page?.title || ""),
    cmsPageId: page?.id,
    cmsPageSlug: slug,
    isDeleted: stored.deleted === true,
  };
}

export function mergeCommissionsWithPages(defaults, pages) {
  const pageEntries = (Array.isArray(pages) ? pages : [])
    .map(readCommissionPage)
    .filter(Boolean);
  const byId = new Map(pageEntries.map((commission) => [String(commission.id), commission]));
  const deletedIds = new Set(
    pageEntries.filter((commission) => commission.isDeleted).map((commission) => String(commission.id))
  );
  const result = (Array.isArray(defaults) ? defaults : [])
    .filter((commission) => !deletedIds.has(String(commission.id)))
    .map((commission) => ({
      ...commission,
      ...(byId.get(String(commission.id)) || {}),
    }));
  const seen = new Set(result.map((commission) => String(commission.id)));

  for (const commission of pageEntries) {
    const id = String(commission.id);
    if (commission.isDeleted || seen.has(id)) continue;
    result.push(commission);
    seen.add(id);
  }
  return result;
}

export function commissionPagePayload(commission, { deleted = false } = {}) {
  const id = String(commission?.id || "").trim();
  const name = String(commission?.name || "").trim();
  if (!id || !name) throw new Error("Для сохранения комиссии нужны ID и название");

  const details = {};
  for (const key of [
    "parentBody",
    "documentType",
    "resolutionDate",
    "resolutionNumber",
    "resolutionSubject",
    "bodyHtml",
  ]) {
    if (commission[key] !== undefined) details[key] = String(commission[key] ?? "");
  }

  return {
    slug: commissionPageSlug(id),
    title: name,
    content: JSON.stringify({
      type: COMMISSION_PAGE_TYPE,
      version: 1,
      id,
      deleted,
      commission: { id, name, ...details },
    }),
    isPublished: true,
  };
}
