const STORAGE_KEY = "khural_documents_overrides_v1";
const EVENT_NAME = "khural:documents-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readDocumentsOverrides() {
  if (typeof window === "undefined") return { deletedIds: [] };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? safeParse(raw) : null;
  if (!parsed || typeof parsed !== "object") return { deletedIds: [] };
  const deletedIds = Array.isArray(parsed.deletedIds) ? parsed.deletedIds.map(String) : [];
  return { deletedIds };
}

export function writeDocumentsOverrides(next) {
  if (typeof window === "undefined") return;
  const cur = readDocumentsOverrides();
  const merged = {
    ...cur,
    ...(next && typeof next === "object" ? next : {}),
  };
  const deletedIds = Array.isArray(merged.deletedIds) ? merged.deletedIds.map(String) : [];
  const payload = { deletedIds: Array.from(new Set(deletedIds)) };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function addDeletedDocumentId(id) {
  const sid = String(id || "").trim();
  if (!sid) return;
  const cur = readDocumentsOverrides();
  writeDocumentsOverrides({ ...cur, deletedIds: [...(cur.deletedIds || []), sid] });
}

export const DOCUMENTS_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const DOCUMENTS_OVERRIDES_EVENT_NAME = EVENT_NAME;



