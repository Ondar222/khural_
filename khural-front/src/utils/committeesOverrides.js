export const COMMITTEES_OVERRIDES_STORAGE_KEY = "khural_committees_overrides_v1";
export const COMMITTEES_OVERRIDES_EVENT_NAME = "khural:committees-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readCommitteesOverrides() {
  if (typeof window === "undefined")
    return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(COMMITTEES_OVERRIDES_STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object")
    return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object"
        ? parsed.updatedById
        : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeCommitteesOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(COMMITTEES_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(COMMITTEES_OVERRIDES_EVENT_NAME));
  } catch {
    // ignore
  }
}

