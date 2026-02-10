import { stripHtmlTags } from "./html.js";

/** Нормализует строку для поиска: нижний регистр, схлопывание пробелов */
function norm(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Находит упоминания депутатов, комитетов и созывов в тексте документа (название + описание).
 * Возвращает { deputies: [{id, label}], committees: [{id, label}], convocations: [{id, label}] }
 */
export function getDocumentLinkedEntities(textRaw, { deputies = [], committees = [], convocations = [] }) {
  const text = norm(stripHtmlTags(String(textRaw ?? "")));
  if (!text) return { deputies: [], committees: [], convocations: [] };

  const deputiesList = Array.isArray(deputies) ? deputies : [];
  const committeesList = Array.isArray(committees) ? committees : [];
  const convocationsList = Array.isArray(convocations) ? convocations : [];

  const linkedDeputies = [];
  for (const d of deputiesList) {
    const name = String(d?.name ?? d?.fullName ?? "").trim();
    const fullName = String(d?.fullName ?? d?.name ?? "").trim();
    if (!name && !fullName) continue;
    const label = fullName || name;
    const nameNorm = norm(name);
    const fullNorm = norm(fullName);
    let matched = false;
    if (nameNorm && text.includes(nameNorm)) matched = true;
    if (!matched && fullNorm && fullNorm !== nameNorm && text.includes(fullNorm)) matched = true;
    if (!matched) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        const short = `${parts[0]} ${parts[1].charAt(0)}.`;
        if (norm(short).length >= 4 && text.includes(norm(short))) matched = true;
        const surnameFirst = norm(parts[0] + " " + parts[1]);
        if (!matched && surnameFirst.length >= 4 && text.includes(surnameFirst)) matched = true;
        const surname = norm(parts[0]);
        const firstName = norm(parts[1]);
        if (!matched && surname.length >= 2 && text.includes(surname)) {
          if (text.includes(firstName)) matched = true;
          else if (firstName.length >= 3 && text.includes(firstName.slice(0, -1))) matched = true;
          else if (firstName.length >= 3 && text.includes(firstName + "ы")) matched = true;
          else if (firstName.length >= 3 && text.includes(firstName + "и")) matched = true;
        }
      }
    }
    if (matched) linkedDeputies.push({ id: d.id, label });
  }

  const linkedCommittees = [];
  for (const c of committeesList) {
    const name = String(c?.name ?? c?.title ?? "").trim();
    const title = String(c?.title ?? c?.name ?? "").trim();
    if (!name && !title) continue;
    const label = title || name;
    const nameNorm = norm(name);
    const titleNorm = norm(title);
    let matched = false;
    if (nameNorm.length >= 3 && text.includes(nameNorm)) matched = true;
    if (!matched && titleNorm.length >= 3 && text.includes(titleNorm)) matched = true;
    if (!matched && (nameNorm.length > 25 || titleNorm.length > 25)) {
      const long = nameNorm.length >= titleNorm.length ? nameNorm : titleNorm;
      const part = long.slice(-40);
      if (part.length >= 20 && text.includes(part)) matched = true;
    }
    if (matched) linkedCommittees.push({ id: c.id, label });
  }

  const linkedConvocations = [];
  for (const conv of convocationsList) {
    const id = conv && typeof conv === "object" ? conv?.id : conv;
    const name = conv && typeof conv === "object" ? String(conv?.name ?? conv?.number ?? "").trim() : String(conv ?? "").trim();
    const idStr = String(id ?? conv ?? "");
    const label = name || idStr || `Созыв`;
    const nameNorm = norm(name || idStr);
    if (!nameNorm) continue;
    if (text.includes(nameNorm)) {
      linkedConvocations.push({ id: idStr, label: label || `Созыв ${idStr}` });
      continue;
    }
    if (text.includes("созыв " + nameNorm) || text.includes(nameNorm + " созыв") || text.includes("вх-" + nameNorm) || text.includes("пвх-" + nameNorm)) {
      linkedConvocations.push({ id: idStr, label: label || `Созыв ${idStr}` });
    }
  }

  return {
    deputies: linkedDeputies,
    committees: linkedCommittees,
    convocations: linkedConvocations,
  };
}
