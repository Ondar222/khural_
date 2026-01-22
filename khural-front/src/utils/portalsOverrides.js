const PORTALS_OVERRIDES_STORAGE_KEY = "khural_portals_overrides_v1";
const PORTALS_OVERRIDES_EVENT_NAME = "khural:portals-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readPortalsOverrides() {
  if (typeof window === "undefined") return { created: [], updatedById: {}, deletedIds: [] };
  const raw = window.localStorage?.getItem(PORTALS_OVERRIDES_STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById: parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writePortalsOverrides(overrides) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PORTALS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new Event(PORTALS_OVERRIDES_EVENT_NAME));
  } catch (e) {
    console.error("Failed to write portals overrides:", e);
  }
}

export function mergePortalsWithOverrides(base, overrides) {
  const created = Array.isArray(overrides?.created) ? overrides.created : [];
  const updatedById =
    overrides?.updatedById && typeof overrides.updatedById === "object"
      ? overrides.updatedById
      : {};
  const deletedIds = new Set(
    Array.isArray(overrides?.deletedIds) ? overrides.deletedIds.map(String) : []
  );

  const out = [];
  const seen = new Set();

  for (const it of Array.isArray(base) ? base : []) {
    const idStr = String(it?.id ?? "");
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    const override = updatedById[idStr];
    out.push(override ? { ...it, ...override } : it);
    seen.add(idStr);
  }

  for (const it of created) {
    const idStr = String(it?.id ?? "");
    if (!idStr) continue;
    if (deletedIds.has(idStr)) continue;
    if (seen.has(idStr)) continue;
    out.push(it);
    seen.add(idStr);
  }

  return out;
}

export { PORTALS_OVERRIDES_STORAGE_KEY, PORTALS_OVERRIDES_EVENT_NAME };
