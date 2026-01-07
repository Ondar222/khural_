const STORAGE_KEY = "khural_deputies_overrides_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readDeputiesOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeDeputiesOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("khural:deputies-updated"));
  } catch {
    // ignore
  }
}


