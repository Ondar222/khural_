const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const RUSSIAN_ORDINALS = [
  /перв(?:ый|ого|ом)/i,
  /втор(?:ой|ого|ом)/i,
  /трет(?:ий|ьего|ьем)/i,
  /четверт(?:ый|ого|ом)/i,
  /пят(?:ый|ого|ом)/i,
  /шест(?:ой|ого|ом)/i,
  /седьм(?:ой|ого|ом)/i,
  /восьм(?:ой|ого|ом)/i,
  /девят(?:ый|ого|ом)/i,
  /десят(?:ый|ого|ом)/i,
];

export function getConvocationNumber(value) {
  const candidates =
    value && typeof value === "object"
      ? [value.number, value.name, value.title, value.id]
      : [value];

  for (const candidate of candidates) {
    const text = String(candidate ?? "").trim();
    if (!text) continue;

    const roman = text.match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/i);
    if (roman) return roman[1].toUpperCase();

    const ordinalIndex = RUSSIAN_ORDINALS.findIndex((pattern) => pattern.test(text));
    if (ordinalIndex >= 0) return ROMAN_NUMERALS[ordinalIndex];
  }

  return "";
}

export function getCommitteeConvocation(committee) {
  return (
    committee?.convocationComittees ??
    committee?.convocation ??
    committee?.convocationId ??
    committee?.convocation_id ??
    null
  );
}

export function getCommitteeConvocationId(committee) {
  const convocation = getCommitteeConvocation(committee);
  if (convocation && typeof convocation === "object") {
    return convocation.id ?? convocation.value ?? convocation.number ?? convocation.name ?? null;
  }
  return convocation;
}

export function isStaticConvocationId(id) {
  return /^(?:local-static-)?(?:I|II|III|IV|V|VI|VII|VIII|IX|X)$/i.test(String(id ?? ""));
}

export function mergeConvocationsPreferApi(apiList, fallbackList) {
  const result = (Array.isArray(apiList) ? apiList : []).map((item) =>
    item && typeof item === "object" ? { ...item } : item
  );
  const byId = new Map();
  const byNumber = new Map();
  const byName = new Map();
  const nameKey = (item) =>
    String(item?.name || item?.number || item?.title || item || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  for (const item of result) {
    if (!item || typeof item !== "object") continue;
    if (item.id != null) byId.set(String(item.id), item);
    const number = getConvocationNumber(item);
    if (number) byNumber.set(number, item);
    const key = nameKey(item);
    if (key) byName.set(key, item);
  }

  for (const fallback of Array.isArray(fallbackList) ? fallbackList : []) {
    if (fallback == null) continue;
    if (typeof fallback === "string") {
      const key = nameKey(fallback);
      if (!key || byName.has(key)) continue;
      const row = { id: fallback, name: fallback };
      result.push(row);
      byName.set(key, row);
      continue;
    }

    const number = getConvocationNumber(fallback);
    const key = nameKey(fallback);
    const target =
      (fallback.id != null && byId.get(String(fallback.id))) ||
      (number && byNumber.get(number)) ||
      (key && byName.get(key));
    if (!target) {
      result.push(fallback);
      if (number) byNumber.set(number, fallback);
      if (key) byName.set(key, fallback);
      if (fallback.id != null) byId.set(String(fallback.id), fallback);
      continue;
    }

    for (const field of ["number", "title", "years", "description", "isActive"]) {
      if (!Object.hasOwn(target, field) && fallback[field] != null && fallback[field] !== "") {
        target[field] = fallback[field];
      }
    }
    if (!Object.hasOwn(target, "name") && fallback.name) target.name = fallback.name;
    if (fallback.stats && typeof fallback.stats === "object" && !Array.isArray(fallback.stats)) {
      const apiStats =
        target.stats && typeof target.stats === "object" && !Array.isArray(target.stats)
          ? target.stats
          : {};
      target.stats = { ...fallback.stats, ...apiStats };
    }
  }
  return result;
}
