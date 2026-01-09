const STORAGE_KEY = "khural_events_overrides_v1";
const EVENT_NAME = "khural:events-updated";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readEventsOverrides() {
  if (typeof window === "undefined") return { created: [] };
  const raw = window.localStorage?.getItem(STORAGE_KEY) || "";
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") return { created: [], updatedById: {}, deletedIds: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object" ? parsed.updatedById : {},
    deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
  };
}

export function writeEventsOverrides(next) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // ignore
  }
}

function toText(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    if (typeof v.getContent === "function") {
      try {
        return String(v.getContent() || "");
      } catch {
        return "";
      }
    }
    if (typeof v?.target?.value === "string") return v.target.value;
    if (typeof v?.content === "string") return v.content;
    if (typeof v?.html === "string") return v.html;
    return "";
  }
  return String(v);
}

function normalizeEvent(event) {
  const id = String(event?.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    date: toText(event?.date),
    title: toText(event?.title),
    time: toText(event?.time),
    place: toText(event?.place),
    desc: toText(event?.desc),
    isImportant: Boolean(event?.isImportant),
  };
}

export function addCreatedEvent(event) {
  const normalized = normalizeEvent(event);
  if (!normalized) return;
  const cur = readEventsOverrides();
  const created = Array.isArray(cur.created) ? cur.created : [];
  const seen = new Set(created.map((e) => String(e?.id ?? "")));
  if (seen.has(normalized.id)) return;
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.delete(normalized.id);
  writeEventsOverrides({
    created: [normalized, ...created],
    updatedById: cur.updatedById || {},
    deletedIds: Array.from(deleted),
  });
}

export function updateEventOverride(id, patch) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const normalized = normalizeEvent({ ...(patch || {}), id: key });
  if (!normalized) return;
  const cur = readEventsOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  if (deleted.has(key)) return;
  writeEventsOverrides({
    created: cur.created || [],
    updatedById: { ...(cur.updatedById || {}), [key]: normalized },
    deletedIds: cur.deletedIds || [],
  });
}

export function addDeletedEventId(id) {
  const key = String(id ?? "").trim();
  if (!key) return;
  const cur = readEventsOverrides();
  const deleted = new Set((cur.deletedIds || []).map(String));
  deleted.add(key);
  const created = (cur.created || []).filter((e) => String(e?.id ?? "") !== key);
  const updatedById = { ...(cur.updatedById || {}) };
  delete updatedById[key];
  writeEventsOverrides({ created, updatedById, deletedIds: Array.from(deleted) });
}

export const EVENTS_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const EVENTS_OVERRIDES_EVENT_NAME = EVENT_NAME;


