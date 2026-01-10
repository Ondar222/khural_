const STORAGE_KEY = "khural_news_overrides_v1";
const EVENT_NAME = "khural:news-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readNewsOverrides() {
  if (typeof window === "undefined") return { deletedIds: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { deletedIds: [] };
  return {
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeNewsOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore
  }
}

export function addDeletedNewsId(id) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const cur = readNewsOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.add(key);
  writeNewsOverrides({ deletedIds: Array.from(deleted) });
}

export const NEWS_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const NEWS_OVERRIDES_EVENT_NAME = EVENT_NAME;




