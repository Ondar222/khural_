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

function parseCommissionContent(content) {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    return content?.type === COMMISSION_PAGE_TYPE && content?.version === 1
      ? content
      : null;
  }
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.type === COMMISSION_PAGE_TYPE && parsed?.version === 1) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function getCommissionStored(page) {
  for (const source of [page?.content, page?.localizedContent]) {
    const entries = Array.isArray(source) ? source : source ? [source] : [];
    const localeSortedEntries = entries
      .map((entry, index) => ({
        entry,
        index,
        stored: parseCommissionContent(
          typeof entry === "string" ? entry : entry?.content
        ),
      }))
      .filter((item) => item.stored)
      .sort((a, b) => {
        const aIsRussian = String(a.entry?.locale || "").toLowerCase() === "ru";
        const bIsRussian = String(b.entry?.locale || "").toLowerCase() === "ru";
        if (aIsRussian !== bIsRussian) {
          return Number(bIsRussian) - Number(aIsRussian);
        }

        const aId = Number(a.entry?.id);
        const bId = Number(b.entry?.id);
        if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
          return bId - aId;
        }

        return a.index - b.index;
      });
    if (localeSortedEntries.length > 0) return localeSortedEntries[0].stored;
    const stored = parseCommissionContent(source);
    if (stored) return stored;
  }
  return null;
}

export function getCommissionContentRecords(page, commissionId) {
  const records = new Map();
  for (const source of [page?.content, page?.localizedContent]) {
    const entries = Array.isArray(source) ? source : [];
    for (const entry of entries) {
      const stored = parseCommissionContent(entry?.content);
      if (
        entry?.id == null ||
        String(stored?.id || "") !== String(commissionId)
      ) {
        continue;
      }
      records.set(String(entry.id), {
        id: String(entry.id),
        locale: String(entry.locale || "ru").toLowerCase(),
      });
    }
  }
  return [...records.values()];
}

export function readCommissionPage(page) {
  const slug = String(page?.slug || "");
  if (!slug.startsWith(COMMISSION_PAGE_SLUG_PREFIX)) return null;

  const stored = getCommissionStored(page);
  if (!stored) return null;

  const id = String(stored.id || slug.slice(COMMISSION_PAGE_SLUG_PREFIX.length));
  return {
    ...(stored.commission || {}),
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
