// Simple API client with auth token support and JSON helpers
function normalizeBaseUrl(value) {
  if (!value) return "";
  const str = String(value).trim();
  // Strip wrapping quotes/backticks and trailing semicolons that sometimes get into env vars
  return str.replace(/^[`'"]+/, "").replace(/[`'";]+$/, "").trim();
}

function resolveApiBaseUrl() {
  // Priority: window override → <meta name="api-base"> → Vite env → sensible fallback
  if (typeof window !== "undefined" && window.__API_BASE_URL__) {
    const normalized = normalizeBaseUrl(window.__API_BASE_URL__);
    if (normalized) return normalized;
  }

  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="api-base"]');
    const normalized = normalizeBaseUrl(meta?.content);
    if (normalized) return normalized;
  }

  const fromEnv = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (fromEnv) return fromEnv;

  // Fallbacks
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "/api"; // dev proxy
    return window.location.origin;
  }

  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

function unwrapApiPayload(payload) {
  // Many endpoints return plain JSON; some return { data, meta }.
  // Normalize by returning `data` when present.
  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }
  return payload;
}

export function getAuthToken() {
  try {
    const direct = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (direct) return direct;
    for (const k of LEGACY_ACCESS_TOKEN_KEYS) {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    return "";
  } catch {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      // keep legacy key in sync for backward compatibility
      for (const k of LEGACY_ACCESS_TOKEN_KEYS) localStorage.setItem(k, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      for (const k of LEGACY_ACCESS_TOKEN_KEYS) localStorage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setRefreshToken(token) {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

let refreshInFlight = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const url = API_BASE_URL.replace(/\/+$/, "") + "/" + "auth/refresh";
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const access = getAuthToken();
    if (access) headers.Authorization = `Bearer ${access}`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ refresh }),
    });
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const err = new Error(
        (data && (data.message || data.error)) || `Request failed: ${res.status}`
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return unwrapApiPayload(data);
  })();

  try {
    const creds = await refreshInFlight;
    const access = creds?.access_token || creds?.accessToken || creds?.token || "";
    const nextRefresh = creds?.refresh_token || creds?.refreshToken || "";
    if (access) setAuthToken(access);
    if (nextRefresh) setRefreshToken(nextRefresh);
    return creds;
  } finally {
    refreshInFlight = null;
  }
}

export async function apiFetch(
  path,
  { method = "GET", body, headers, auth = true, retry = true } = {}
) {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  const url = API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  const finalHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    if (res.status === 401 && auth && retry) {
      const refreshed = await refreshAccessToken().catch(() => null);
      const nextAccess =
        refreshed?.access_token || refreshed?.accessToken || refreshed?.token || "";
      if (nextAccess) {
        return apiFetch(path, { method, body, headers, auth, retry: false });
      }
      // refresh failed => clear tokens
      setAuthToken("");
      setRefreshToken("");
    }
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed: ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return unwrapApiPayload(data);
}

export async function apiFetchText(path, { method = "GET", headers, auth = true } = {}) {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  const url = API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  const finalHeaders = {
    Accept: "text/plain,text/markdown,*/*",
    ...(headers || {}),
  };
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { method, headers: finalHeaders });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = text;
    throw err;
  }
  return text;
}

export async function tryApiFetch(path, options) {
  try {
    return await apiFetch(path, options);
  } catch {
    return null;
  }
}

export const AuthApi = {
  async register(user) {
    // Backend supports both POST /user/ and POST /auth/register
    // Try /auth/register first (preferred), fallback to /user/
    try {
      return await apiFetch("/auth/register", {
        method: "POST",
        body: user,
        auth: false,
      });
    } catch {
      // Fallback to /user/ endpoint
      return await apiFetch("/user", {
        method: "POST",
        body: user,
        auth: false,
      });
    }
  },
  async loginWithPassword({ email, password }) {
    // New backend uses POST /auth/login/password
    try {
      return await apiFetch("/auth/login/password", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
    } catch {
      // Compatibility fallback (older deployments)
      return apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
    }
  },
  async refresh(refresh) {
    return apiFetch("/auth/refresh", {
      method: "POST",
      body: { refresh },
      auth: true,
    });
  },
  async me() {
    return apiFetch("/user/me", { method: "GET", auth: true });
  },
};

export const PublicApi = {
  async listPersons() {
    return apiFetch("/persons", { method: "GET", auth: false });
  },
  async listNews() {
    return apiFetch("/news", { method: "GET", auth: false });
  },
  async translate(text, from, to) {
    // In this backend, translation endpoints require admin auth.
    // We keep a safe fallback to avoid breaking the UI for guests.
    try {
      const result = await apiFetch("/translation/translate", {
        method: "POST",
        body: { text, from, to },
        auth: true,
      });
      return result;
    } catch {
      try {
        const result = await apiFetch("/translation/translate-batch", {
          method: "POST",
          body: { texts: [text], from, to },
          auth: true,
        });
        const translated = Array.isArray(result?.translated) ? result.translated[0] : text;
        return { original: text, translated, from, to };
      } catch {
        return { original: text, translated: text, from, to };
      }
    }
  },
};

export const SliderApi = {
  async list({ all = false } = {}) {
    const qs = new URLSearchParams();
    if (all) qs.set("all", "true");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/slider${suffix}`, { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/slider/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/slider", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/slider/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/slider/${id}`, { method: "DELETE", auth: true });
  },
  async uploadImage(id, file) {
    const fd = new FormData();
    fd.append("image", file);
    return apiFetchMultipart(`/slider/${id}/image`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async reorder(ids) {
    return apiFetch("/slider/reorder", { method: "POST", body: { ids }, auth: true });
  },
};

export const SearchApi = {
  async search({ query, contentType, page, limit } = {}) {
    const qs = new URLSearchParams();
    if (query) qs.set("query", query);
    if (contentType) qs.set("contentType", contentType);
    if (page) qs.set("page", String(page));
    if (limit) qs.set("limit", String(limit));
    return apiFetch(`/search?${qs.toString()}`, { method: "GET", auth: false });
  },
};

export const AppealsApi = {
  async create({ subject, message, attachmentIds } = {}) {
    return apiFetch("/appeals", {
      method: "POST",
      body: { subject, message, attachmentIds: attachmentIds || undefined },
      auth: true,
    });
  },
};

export const AboutApi = {
  async listPages({ locale } = {}) {
    const qs = new URLSearchParams();
    if (locale) qs.set("locale", locale);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/about/pages${suffix}`, { method: "GET", auth: false });
  },
  async getPageBySlug(slug, { locale } = {}) {
    const qs = new URLSearchParams();
    if (locale) qs.set("locale", locale);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/about/pages/${encodeURIComponent(slug)}${suffix}`, {
      method: "GET",
      auth: false,
    });
  },
  async listStructure() {
    return apiFetch("/about/structure", { method: "GET", auth: false });
  },
};

export const CommentsApi = {
  async list({ entityType, entityId, onlyApproved = true, includeReplies = true } = {}) {
    const qs = new URLSearchParams();
    qs.set("entityType", entityType);
    qs.set("entityId", String(entityId));
    qs.set("onlyApproved", onlyApproved ? "true" : "false");
    qs.set("includeReplies", includeReplies ? "true" : "false");
    return apiFetch(`/comments?${qs.toString()}`, { method: "GET", auth: false });
  },
  async create({ content, entityType, entityId, parentCommentId } = {}) {
    return apiFetch("/comments", {
      method: "POST",
      body: { content, entityType, entityId, parentCommentId: parentCommentId || undefined },
      auth: true,
    });
  },
};

export const AccessibilityApi = {
  async getSettings({ sessionId } = {}) {
    const qs = new URLSearchParams();
    if (sessionId) qs.set("sessionId", sessionId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/accessibility/settings${suffix}`, { method: "GET", auth: true });
  },
  async saveSettings({ sessionId, fontSize, colorScheme, contrast, disableAnimations } = {}) {
    return apiFetch("/accessibility/settings", {
      method: "POST",
      body: { sessionId, fontSize, colorScheme, contrast, disableAnimations },
      auth: true,
    });
  },
};

// Helpers for multipart uploads
export async function apiFetchMultipart(
  path,
  { method = "POST", formData, headers, auth = true } = {}
) {
  if (!(formData instanceof FormData)) {
    throw new Error("formData must be FormData");
  }
  const url = API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  const finalHeaders = { ...(headers || {}) };
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: formData,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed: ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return unwrapApiPayload(data);
}

// Persons-related endpoints (admin + public)
export const PersonsApi = {
  // Public
  async list(params) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch(`/persons${qs}`, { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/persons/${id}`, { method: "GET", auth: false });
  },
  async listCategoriesAll() {
    return apiFetch("/persons/categories/all", { method: "GET", auth: false });
  },
  async listFactionsAll() {
    return apiFetch("/persons/factions/all", { method: "GET", auth: false });
  },
  async listDistrictsAll() {
    return apiFetch("/persons/districts/all", { method: "GET", auth: false });
  },
  async listConvocationsAll() {
    return apiFetch("/persons/convocations/all", {
      method: "GET",
      auth: false,
    });
  },
  async getDeclarations(id) {
    return apiFetch(`/persons/${id}/declarations`, {
      method: "GET",
      auth: false,
    });
  },

  // Admin (requires auth)
  async create(person) {
    return apiFetch("/persons", { method: "POST", body: person, auth: true });
  },
  async patch(id, partial) {
    return apiFetch(`/persons/${id}`, {
      method: "PATCH",
      body: partial,
      auth: true,
    });
  },
  async put(id, full) {
    return apiFetch(`/persons/${id}`, {
      method: "PUT",
      body: full,
      auth: true,
    });
  },
  async remove(id) {
    return apiFetch(`/persons/${id}`, { method: "DELETE", auth: true });
  },
  async uploadMedia(id, file) {
    const fd = new FormData();
    // backend expects field name "image"
    fd.append("image", file);
    return apiFetchMultipart(`/persons/${id}/media`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async addDeclaration(id, file, extra = {}) {
    const fd = new FormData();
    if (file) fd.append("file", file);
    Object.entries(extra || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    return apiFetchMultipart(`/persons/${id}/declarations`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async deleteDeclaration(id, declarationId) {
    return apiFetch(`/persons/${id}/declarations/${declarationId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // Categories
  async createCategory(body) {
    return apiFetch("/persons/categories", {
      method: "POST",
      body,
      auth: true,
    });
  },

  // Factions
  async createFaction(body) {
    return apiFetch("/persons/factions", { method: "POST", body, auth: true });
  },
  async updateFaction(id, body) {
    return apiFetch(`/persons/factions/${id}`, {
      method: "PUT",
      body,
      auth: true,
    });
  },
  async deleteFaction(id) {
    return apiFetch(`/persons/factions/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // Districts
  async createDistrict(body) {
    return apiFetch("/persons/districts", { method: "POST", body, auth: true });
  },
  async updateDistrict(id, body) {
    return apiFetch(`/persons/districts/${id}`, {
      method: "PUT",
      body,
      auth: true,
    });
  },
  async deleteDistrict(id) {
    return apiFetch(`/persons/districts/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },

  // Convocations
  async createConvocation(body) {
    return apiFetch("/persons/convocations", {
      method: "POST",
      body,
      auth: true,
    });
  },
  async updateConvocation(id, body) {
    return apiFetch(`/persons/convocations/${id}`, {
      method: "PUT",
      body,
      auth: true,
    });
  },
  async deleteConvocation(id) {
    return apiFetch(`/persons/convocations/${id}`, {
      method: "DELETE",
      auth: true,
    });
  },
};

// News-related endpoints
export const NewsApi = {
  async list() {
    return apiFetch("/news", { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/news/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/news", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/news/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/news/${id}`, { method: "DELETE", auth: true });
  },
  async uploadMedia(id, files) {
    const fd = new FormData();
    const arr = Array.isArray(files) ? files : files ? [files] : [];
    arr.forEach((f) => fd.append("images", f));
    return apiFetchMultipart(`/news/${id}/media`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
};

// Documents-related endpoints
export const DocumentsApi = {
  async list() {
    return apiFetch("/documents", { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/documents/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/documents", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/documents/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/documents/${id}`, { method: "DELETE", auth: true });
  },
  async uploadFile(id, file) {
    const fd = new FormData();
    fd.append("pdf", file);
    return apiFetchMultipart(`/documents/${id}/pdf`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
};

// Calendar (events) endpoints
export const EventsApi = {
  async list() {
    return apiFetch("/calendar", { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/calendar/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/calendar", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/calendar/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/calendar/${id}`, { method: "DELETE", auth: true });
  },
};
