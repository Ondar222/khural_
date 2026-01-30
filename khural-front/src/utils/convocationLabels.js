/**
 * Справочник годов созывов Верховного Хурала РТ.
 * Используется для подписи фильтра и карточек депутатов.
 */
export const CONVOCATION_YEARS = {
  I: "2010 - 2014 гг.",
  II: "2014 - 2019 гг.",
  III: "2019 - 2024 гг.",
  IV: "2024 - по наст. вр",
  V: "",
  VI: "",
  VII: "",
  VIII: "",
  IX: "",
  X: "",
};

/** Год → токен созыва (для депутатов, у которых созыв указан годом: 2019, 2020 и т.д.) */
const YEAR_TO_CONVOCATION = {
  2010: "I", 2011: "I", 2012: "I", 2013: "I", 2014: "I",
  2015: "II", 2016: "II", 2017: "II", 2018: "II", 2019: "II",
  2020: "III", 2021: "III", 2022: "III", 2023: "III", 2024: "III",
  2025: "IV", 2026: "IV",
};
// 2014 на границе I/II, 2019 на границе II/III, 2024 на границе III/IV
YEAR_TO_CONVOCATION["2014"] = "II";
YEAR_TO_CONVOCATION["2019"] = "III";
YEAR_TO_CONVOCATION["2024"] = "IV";

/**
 * Возвращает подпись созыва с годами для фильтра/списка (например "IV созыв (2024 - по наст. вр)").
 * Поддерживает токен в виде номера созыва (I, II, III, IV) или года (2019, 2020 и т.д.).
 * @param {string} token - токен созыва: "Все", "I", "II", "III", "IV" или "2019", "2020" и т.д.
 * @returns {string}
 */
export function formatConvocationLabelWithYears(token) {
  if (!token || String(token).trim() === "") return "Без созыва";
  let t = String(token).trim().replace(/\s*г\.?о?д\.?$/i, "");
  if (t === "Все") return "Все созывы";
  const yearNum = parseInt(t, 10);
  if (Number.isFinite(yearNum) && t.length >= 4) {
    const conv = YEAR_TO_CONVOCATION[String(yearNum)];
    if (conv) {
      const years = CONVOCATION_YEARS[conv];
      if (years) return `${conv} созыв (${years})`;
      return `${conv} созыв`;
    }
    return `${t} г.`;
  }
  const years = CONVOCATION_YEARS[t] || CONVOCATION_YEARS[t.toUpperCase()];
  if (years) return `${t} созыв (${years})`;
  return `${t} созыв`;
}

/**
 * Возвращает только строку годов для созыва (для отображения рядом с номером).
 * @param {string} token - токен созыва
 * @returns {string}
 */
export function getConvocationYears(token) {
  if (!token || String(token).trim() === "") return "";
  const t = String(token).trim();
  return CONVOCATION_YEARS[t] || CONVOCATION_YEARS[t.toUpperCase()] || "";
}

/** Канонические созывы для фильтра (остальные варианты приводятся к ним). */
export const CANONICAL_CONVOCATIONS = ["I", "II", "III", "IV"];

/**
 * Приводит значение созыва к каноническому (I, II, III, IV).
 * «11 созыв», «2014 год», «2020» и т.п. объединяются с II/III, чтобы в фильтре не было дублей.
 * @param {string} raw - сырое значение (11, 2014 год, 2020, II и т.д.)
 * @returns {string} "I" | "II" | "III" | "IV" | "Все" | "" или исходное, если не удалось сопоставить
 */
export function normalizeConvocationToCanonical(raw) {
  const s = String(raw || "").replace(/\s*г\.?о?д\.?$/gi, "").trim();
  if (!s) return "";
  if (s.toLowerCase() === "все") return "Все";
  if (s === "11") return "II";
  const num = parseInt(s, 10);
  if (Number.isFinite(num)) {
    if (num >= 2010 && num <= 2030) {
      if (num <= 2014) return "I";
      if (num <= 2019) return "II";
      if (num <= 2024) return "III";
      return "IV";
    }
    if (num >= 1 && num <= 10) {
      const roman = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII", 8: "VIII", 9: "IX", 10: "X" };
      const r = roman[num];
      if (CANONICAL_CONVOCATIONS.includes(r)) return r;
      return r || s;
    }
  }
  const upper = s.toUpperCase();
  if (CANONICAL_CONVOCATIONS.includes(upper)) return upper;
  if (/^[IVX]+$/i.test(s)) return upper;
  return s;
}
