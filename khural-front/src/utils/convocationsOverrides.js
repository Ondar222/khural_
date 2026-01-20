export const CONVOCATIONS_OVERRIDES_STORAGE_KEY = "khural_convocations_overrides_v1";
export const CONVOCATIONS_OVERRIDES_EVENT_NAME = "khural:convocations-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readConvocationsOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(CONVOCATIONS_OVERRIDES_STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeConvocationsOverrides(next) {
  if (typeof window === "undefined") return;
  window.localStorage?.setItem(CONVOCATIONS_OVERRIDES_STORAGE_KEY, JSON.stringify(next || {}));
  window.dispatchEvent(new Event(CONVOCATIONS_OVERRIDES_EVENT_NAME));
}

