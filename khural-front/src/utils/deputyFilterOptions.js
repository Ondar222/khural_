import { decodeHtmlEntities } from "./html.js";

/** Извлекает названия фракций из текста биографии. */
export function getFactionsFromBio(bioRaw) {
  if (!bioRaw || typeof bioRaw !== "string") return [];
  const text = decodeHtmlEntities(bioRaw)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return [];
  const found = new Set();
  const known = [
    "Единая Россия",
    "КПРФ",
    "ЛДПР",
    "Новые люди",
    "Единая Тыва",
  ];
  const lower = text.toLowerCase();
  for (const name of known) {
    if (lower.includes(name.toLowerCase())) found.add(name);
  }
  const quoted = text.matchAll(/(?:Партии|партии|фракци[ия]?|сторонником)\s*[«"]([^»"]+)[»"]/gi);
  for (const m of quoted) {
    const s = (m[1] || "").trim();
    if (s.length > 0 && s.length < 80) found.add(s);
  }
  return Array.from(found);
}

/** Нормализация для сравнения фракций. */
export function normalizeFactionKey(s) {
  const key = String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
  if (key === "едина россия") return "единая россия";
  if (key === "кпрф" || key === "коммунистическая партия российской федерации") return "кпрф";
  return key;
}

/** Каноническое отображаемое название фракции. */
export function canonicalizeFactionDisplay(name) {
  const key = normalizeFactionKey(name);
  if (key === "единая россия") return "Единая Россия";
  if (key === "кпрф") return "КПРФ";
  return String(name || "").trim();
}

/** Извлекает названия округов из текста биографии. */
export function getDistrictsFromBio(bioRaw) {
  if (!bioRaw || typeof bioRaw !== "string") return [];
  const text = decodeHtmlEntities(bioRaw)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return [];
  const found = new Set();
  const known = [
    "Кызыльский", "Кызылский кожуун", "Тере-Холь", "Тандинский", "Улуг-Хемский",
    "Эрзинский", "Тес-Хемский", "Овюрский", "Монгун-Тайгинский", "Каа-Хемский",
    "Пий-Хемский", "Тоджинский", "Чаа-Хольский", "Чеди-Хольский", "Бай-Тайгинский",
    "Сут-Хольский", "Барун-Хемчикский", "Дзун-Хемчикский",
  ];
  const lower = text.toLowerCase();
  for (const name of known) {
    if (lower.includes(name.toLowerCase())) found.add(name);
  }
  const numMatch = text.matchAll(/(?:избирательный\s+округ|округ)\s*[№#]?\s*(\d+)/gi);
  for (const m of numMatch) {
    if (m[1]) found.add("№ " + m[1]);
  }
  const afterRound = text.matchAll(/(?:избирательный\s+округ|по\s+округу)\s*[«:]\s*([^».\n]{1,60})/gi);
  for (const m of afterRound) {
    const s = (m[1] || "").trim();
    if (s.length > 0) found.add(s);
  }
  return Array.from(found);
}

/** Нормализация округа для сравнения. */
export function normalizeDistrictKey(s) {
  return String(s || "").trim().replace(/\s+/g, " ").toLowerCase().replace(/№\s*/g, "№");
}

const toStr = (item) => {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") return String(item.name || item.title || item.label || item).trim();
  return String(item || "").trim();
};

/**
 * Строит объединённый список фракций для фильтра: существующие + из депутатов (поле + биография).
 * Используется на странице Депутаты и в админке.
 */
export function buildFactionOptions(existingFactions, deputies) {
  const fromExisting = (Array.isArray(existingFactions) ? existingFactions : []).map(toStr).filter(Boolean);
  const fromDeputies = Array.from(
    new Set(
      (Array.isArray(deputies) ? deputies : []).map((d) => toStr(d?.faction)).filter(Boolean)
    )
  );
  const fromBio = (Array.isArray(deputies) ? deputies : []).flatMap((d) =>
    getFactionsFromBio(d?.biography || d?.bio || d?.description || "")
  );
  const raw = [...fromExisting, ...fromDeputies, ...fromBio].filter(Boolean);
  const merged = Array.from(new Set(raw.map(canonicalizeFactionDisplay))).filter(Boolean);
  merged.sort((a, b) => a.localeCompare(b, "ru"));
  return merged;
}

/**
 * Строит объединённый список округов для фильтра: существующие + из депутатов (поле + биография).
 */
export function buildDistrictOptions(existingDistricts, deputies) {
  const fromExisting = (Array.isArray(existingDistricts) ? existingDistricts : []).map(toStr).filter(Boolean);
  const fromDeputies = Array.from(
    new Set(
      (Array.isArray(deputies) ? deputies : [])
        .map((d) => toStr(d?.district || d?.electoralDistrict))
        .filter(Boolean)
    )
  );
  const fromBio = (Array.isArray(deputies) ? deputies : []).flatMap((d) =>
    getDistrictsFromBio(d?.biography || d?.bio || d?.description || "")
  );
  const merged = Array.from(new Set([...fromExisting, ...fromDeputies, ...fromBio])).filter(Boolean);
  merged.sort((a, b) => a.localeCompare(b, "ru"));
  return merged;
}
