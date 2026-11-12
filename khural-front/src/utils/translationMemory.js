/**
 * Память уже переведённых на тувинский текст.
 *
 * Автоматический переводчик страницы (AutomaticPageTranslator) переводит все
 * русскоязычные текстовые узлы через Google Translate (ru → tyv). Проблема в том,
 * что тувинский язык тоже использует кириллицу, поэтому уже переведённые строки
 * («Медээлер», «Документилер», «Депутаттар» и т. д.) попадают в переводчик повторно
 * и портятся: «Медээлер» → «Медалер», «Документилер» → «Документатор» и т. п.
 *
 * Здесь мы запоминаем все строки, которые уже являются тувинским переводом,
 * чтобы автоматический переводчик их пропускал.
 */

const knownTuvanTexts = new Set();

/** Приводит строку к виду, удобному для сравнения (пробелы, кавычки, знаки). */
export function normalizeTranslationKey(value) {
  return String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[\s«»"'„“”(){}<>.,;:!?—–-]+/, "")
    .replace(/[\s«»"'„“”(){}<>.,;:!?—–-]+$/, "")
    .trim();
}

/** Запоминает строку (или массив строк) как уже переведённую на тувинский. */
export function rememberTuvanText(value) {
  if (value == null) return;
  if (Array.isArray(value)) {
    value.forEach(rememberTuvanText);
    return;
  }
  if (typeof value !== "string") return;
  const key = normalizeTranslationKey(value);
  if (key.length < 3) return;
  if (!/[А-Яа-яЁё]/.test(key)) return;
  knownTuvanTexts.add(key);
}

/** true, если строка уже является тувинским переводом и её не нужно переводить снова. */
export function isKnownTuvanText(value) {
  const key = normalizeTranslationKey(value);
  return key.length > 0 && knownTuvanTexts.has(key);
}
