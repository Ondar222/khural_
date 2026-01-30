export const COMMITTEES_OVERRIDES_STORAGE_KEY = "khural_committees_overrides_v1";
export const COMMITTEES_OVERRIDES_EVENT_NAME = "khural:committees-updated";

/** Комитеты структуры: не могут быть удалены (даже из админки). Всегда показываются на странице «О Верховном Хурале». */
export const SYSTEM_COMMITTEE_IDS = [
  "agro",
  "infra",
  "youth",
  "security",
  "health",
  "const",
  "econ",
  "edu",
  "smi-obshestvo",
  "mezhregionalnye-svyazi",
];

/** Список комитетов по умолчанию для блока «Комитеты Верховного Хурала» — не исчезают при пустом API. */
export const DEFAULT_STRUCTURE_COMMITTEES = [
  { id: "agro", title: "Комитет по аграрной политике, земельным отношениям, природопользованию, экологии и делам коренных малочисленных народов" },
  { id: "infra", title: "Комитет по развитию инфраструктуры и промышленной политике" },
  { id: "youth", title: "Комитет по молодежной, информационной политике, физической культуре и спорту, развитию институтов гражданского общества" },
  { id: "security", title: "Комитет по безопасности и правопорядку" },
  { id: "health", title: "Комитет по охране здоровья, занятости населения и социальной политике" },
  { id: "const", title: "Комитет по конституционно‑правовой политике и местному самоуправлению" },
  { id: "econ", title: "Комитет по экономической, финансово‑бюджетной и налоговой политике, предпринимательству, туризму и государственной собственности" },
  { id: "edu", title: "Комитет по образованию, культуре, науке и национальной политике" },
  { id: "smi-obshestvo", title: "Комитет Верховного Хурала (парламента) Республики Тыва по взаимодействию со средствами массовой информации и общественными организациями" },
  { id: "mezhregionalnye-svyazi", title: "Комитет Верховного Хурала (парламента) Республики Тыва по межрегиональным и международным связям" },
];

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
  const systemSet = new Set(SYSTEM_COMMITTEE_IDS.map(String));
  const deletedIds = (Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [])
    .map(String)
    .filter((id) => !systemSet.has(id));
  return {
    created: Array.isArray(parsed.created) ? parsed.created : [],
    updatedById:
      parsed.updatedById && typeof parsed.updatedById === "object"
        ? parsed.updatedById
        : {},
    deletedIds,
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

