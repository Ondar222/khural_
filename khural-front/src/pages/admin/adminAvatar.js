const STORAGE_KEY = "khural_admin_avatar_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function readAdminAvatar() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (parsed && typeof parsed === "object" && typeof parsed.dataUrl === "string") return parsed.dataUrl;
    if (typeof raw === "string" && raw.startsWith("data:image/")) return raw;
    return null;
  } catch {
    return null;
  }
}

export function writeAdminAvatar(dataUrl) {
  if (typeof window === "undefined") return;
  try {
    if (!dataUrl) {
      window.localStorage?.removeItem(STORAGE_KEY);
    } else {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ dataUrl }));
    }
    window.dispatchEvent(new Event("khural:admin-avatar-updated"));
  } catch {
    // ignore
  }
}


