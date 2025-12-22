export const ADMIN_THEME_KEY = "khural_admin_theme";

export function readAdminTheme() {
  try {
    const v = localStorage.getItem(ADMIN_THEME_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function writeAdminTheme(mode) {
  try {
    localStorage.setItem(ADMIN_THEME_KEY, mode);
  } catch {
    // ignore
  }
}



