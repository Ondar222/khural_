export function normalizeBool(input, defaultValue = undefined) {
  if (input === true || input === false) return input;
  if (input === 1 || input === "1") return true;
  if (input === 0 || input === "0") return false;
  if (input === null || input === undefined || input === "") return defaultValue;
  const s = String(input).trim().toLowerCase();
  if (!s) return defaultValue;
  if (["true", "yes", "y", "да", "активный", "active"].includes(s)) return true;
  if (["false", "no", "n", "нет", "неактивный", "inactive"].includes(s)) return false;
  return defaultValue !== undefined ? defaultValue : Boolean(input);
}

