// Simple API client with auth token support and JSON helpers
function resolveApiBaseUrl() {
  // 1) Runtime override via window.__API_BASE_URL__
  if (typeof window !== "undefined" && window.__API_BASE_URL__) {
    return String(window.__API_BASE_URL__);
  }
  // 2) Runtime override via <meta name="api-base" content="...">
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return meta.content;
  }
  // 3) Build-time env
  const fromEnv = import.meta?.env?.VITE_API_BASE_URL;
  if (fromEnv) return String(fromEnv);
  // 4) Safe defaults:
  // - local dev: backend on :3000
  // - otherwise: same origin as frontend (reverse proxy / single domain deploy)
  if (typeof window !== "undefined" && window.location) {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3000";
    return window.location.origin;
  }
  return "http://localhost:3000";
}
export const API_BASE_URL = resolveApiBaseUrl();
const TOKEN_STORAGE_KEY =
  import.meta?.env?.VITE_API_TOKEN_STORAGE_KEY || "auth_token";

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export async function apiFetch(
  path,
  { method = "GET", body, headers, auth = true } = {}
) {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not configured");
  }
  const url =
    API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
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
  const isJson = (res.headers.get("content-type") || "").includes(
    "application/json"
  );
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed: ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
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
    // Backend in this repo uses POST /auth/register
    try {
      return await apiFetch("/auth/register", {
        method: "POST",
        body: user,
        auth: false,
      });
    } catch (e) {
      // Compatibility fallback
      return apiFetch("/user", { method: "POST", body: user, auth: false });
    }
  },
  async loginWithPassword({ email, password }) {
    // Backend in this repo uses POST /auth/login
    try {
      return await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
    } catch (e) {
      // Compatibility fallback (older deployments)
      return apiFetch("/auth/login/password", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
    }
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
    // Пробуем разные варианты формата запроса
    try {
      // Вариант 1: стандартный формат
      const result = await apiFetch("/translate", {
        method: "POST",
        body: { text, from, to },
        auth: false,
      });
      return result;
    } catch (error) {
      // Вариант 2: альтернативный формат
      try {
        const result = await apiFetch("/api/translate", {
          method: "POST",
          body: { text, source: from, target: to },
          auth: false,
        });
        return result;
      } catch (error2) {
        // Вариант 3: query параметры
        try {
          const result = await apiFetch(`/translate?text=${encodeURIComponent(text)}&from=${from}&to=${to}`, {
            method: "GET",
            auth: false,
          });
          return result;
        } catch (error3) {
          throw error;
        }
      }
    }
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
  const url =
    API_BASE_URL.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
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
  const isJson = (res.headers.get("content-type") || "").includes(
    "application/json"
  );
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = new Error(
      (data && (data.message || data.error)) || `Request failed: ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
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
    fd.append("file", file);
    return apiFetchMultipart(`/documents/${id}/file`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
};

// Events-related endpoints
export const EventsApi = {
  async list() {
    return apiFetch("/events", { method: "GET", auth: false });
  },
  async getById(id) {
    return apiFetch(`/events/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/events", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/events/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/events/${id}`, { method: "DELETE", auth: true });
  },
};
