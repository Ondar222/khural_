export const A11Y_FONT_SIZE_MIN = 12;
export const A11Y_FONT_SIZE_MAX = 24;
export const A11Y_DEFAULT_SETTINGS = {
  fontSize: 16,
  colorScheme: "default",
  contrast: "normal",
  disableAnimations: false,
};

const COLOR_SCHEMES = ["default", "yb", "dark", "blue", "brown"];
const CONTRAST_MODES = ["normal", "high"];

function normalizeFontSize(value, fallback = A11Y_DEFAULT_SETTINGS.fontSize) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return fallback;
  return Math.min(A11Y_FONT_SIZE_MAX, Math.max(A11Y_FONT_SIZE_MIN, Math.round(number)));
}

function normalizeColorScheme(value, fallback = A11Y_DEFAULT_SETTINGS.colorScheme) {
  const scheme = String(value ?? "")
    .trim()
    .toLowerCase();
  return COLOR_SCHEMES.includes(scheme) ? scheme : fallback;
}

function normalizeContrast(value, fallback = A11Y_DEFAULT_SETTINGS.contrast) {
  const contrast = String(value ?? "")
    .trim()
    .toLowerCase();
  return CONTRAST_MODES.includes(contrast) ? contrast : fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "on"].includes(normalized)) return true;
    if (["false", "no", "off", ""].includes(normalized)) return false;
  }
  return fallback;
}

export function normalizeSettings(data, fallback = A11Y_DEFAULT_SETTINGS) {
  if (!data || typeof data !== "object") return { ...fallback };
  return {
    fontSize: normalizeFontSize(data.fontSize, fallback.fontSize),
    colorScheme: normalizeColorScheme(data.colorScheme, fallback.colorScheme),
    contrast: normalizeContrast(data.contrast, fallback.contrast),
    disableAnimations: normalizeBoolean(data.disableAnimations, fallback.disableAnimations),
  };
}
