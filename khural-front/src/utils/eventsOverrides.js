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
  if (!parsed || typeof parsed !== "object") return { created: [] };
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
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

export function addCreatedEvent(event) {
  if (!event || typeof event !== "object") return;
  const id = String(event.id ?? "").trim();
  if (!id) return;
  const toText = (v) => {
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
  };
  const normalized = {
    id,
    date: toText(event.date),
    title: toText(event.title),
    time: toText(event.time),
    place: toText(event.place),
    desc: toText(event.desc),
    isImportant: Boolean(event.isImportant),
  };
  const cur = readEventsOverrides();
  const created = Array.isArray(cur.created) ? cur.created : [];
  const seen = new Set(created.map((e) => String(e?.id ?? "")));
  if (seen.has(id)) return;
  writeEventsOverrides({ created: [normalized, ...created] });
}

export const EVENTS_OVERRIDES_STORAGE_KEY = STORAGE_KEY;
export const EVENTS_OVERRIDES_EVENT_NAME = EVENT_NAME;


