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
    // Prefer same-origin reverse-proxy path. Works in dev (Vite proxy) and prod (nginx proxy).
    if (host === "localhost" || host === "127.0.0.1") return "/api";
    return "/api";
  }

  return "";
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Базовый URL только для API календаря (события). Если VITE_CALENDAR_API_BASE_URL не задан — используем тот же бэкенд, что и для остального приложения (события будут видны на всех устройствах). */
export const CALENDAR_API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_CALENDAR_API_BASE_URL) || API_BASE_URL;

// Логируем базовый URL для отладки (только в DEV)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.log("API_BASE_URL resolved to:", API_BASE_URL);
  console.log("VITE_API_BASE_URL from env:", import.meta.env.VITE_API_BASE_URL);
}

// Константы для хранения токенов в sessionStorage
const ACCESS_TOKEN_STORAGE_KEY = "access_token";
const REFRESH_TOKEN_STORAGE_KEY = "refresh_token";
const LEGACY_ACCESS_TOKEN_KEYS = ["token", "auth_token", "jwt"];

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
    const direct = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (direct) return direct;
    for (const k of LEGACY_ACCESS_TOKEN_KEYS) {
      const v = sessionStorage.getItem(k);
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
      sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
      // keep legacy key in sync for backward compatibility
      for (const k of LEGACY_ACCESS_TOKEN_KEYS) sessionStorage.setItem(k, token);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      for (const k of LEGACY_ACCESS_TOKEN_KEYS) sessionStorage.removeItem(k);
    }
  } catch {
    // ignore storage errors
  }
}

export function getRefreshToken() {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setRefreshToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
  { method = "GET", body, headers, auth = true, retry = true, baseUrl: baseUrlOverride } = {}
) {
  const baseUrl = baseUrlOverride || API_BASE_URL;
  if (!baseUrl) {
    throw new Error("API base URL не настроен. Установите переменную окружения VITE_API_BASE_URL на Vercel.");
  }

  // Проверяем fallback только для основного API (не для calendar)
  if (!baseUrlOverride && typeof window !== "undefined" && API_BASE_URL === window.location.origin) {
    const hostname = window.location.hostname;
    if (import.meta.env.DEV && hostname !== "localhost" && hostname !== "127.0.0.1" && !hostname.includes("localhost")) {
      console.warn("⚠️ API base URL использует текущий домен как fallback.");
      console.warn("Если API находится на другом домене, установите переменную окружения VITE_API_BASE_URL на Vercel.");
    }
  }

  const url = baseUrl.replace(/\/+$/, "") + "/" + String(path).replace(/^\/+/, "");
  
  const finalHeaders = {
    Accept: "application/json",
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(headers || {}),
  };
  if (auth) {
    const token = getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  
  let res;
  let jsonBody;
  if (body) {
    try {
      jsonBody = JSON.stringify(body);
    } catch (e) {
      const err = new Error(
        `Ошибка формирования запроса: данные содержат несериализуемые объекты (например, объект редактора). ` +
          `Проверьте поля формы. Технически: ${e?.message || String(e)}`
      );
      err.serializationError = true;
      throw err;
    }
  }
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? jsonBody : undefined,
    });
  } catch (networkError) {
    // Сетевая ошибка (CORS, недоступен сервер и т.д.)
    const err = new Error(
      `Не удалось подключиться к API: ${networkError.message}. Проверьте, что VITE_API_BASE_URL настроен правильно.`
    );
    err.status = 0;
    err.networkError = true;
    throw err;
  }
  
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;
  
  if (!res.ok) {
    if (res.status === 401 && auth && retry) {
      const refreshed = await refreshAccessToken().catch(() => null);
      const nextAccess =
        refreshed?.access_token || refreshed?.accessToken || refreshed?.token || "";
      if (nextAccess) {
        return apiFetch(path, { method, body, headers, auth, retry: false, baseUrl: baseUrlOverride });
      }
      // refresh failed => clear tokens and trigger logout
      setAuthToken("");
      setRefreshToken("");
      // Dispatch event to notify AuthContext about token expiration
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:token-expired"));
      }
    }
    
    // Улучшенные сообщения об ошибках
    let errorMessage = `Request failed: ${res.status}`;
    if (res.status === 405) {
      errorMessage = `Метод не разрешен (405). Возможно, неправильный endpoint или метод запроса. API URL: ${url}`;
    } else if (res.status === 404) {
      errorMessage = `Endpoint не найден (404). Проверьте правильность URL API.`;
    } else if (res.status === 401) {
      errorMessage = data?.message || data?.error || "Токен авторизации истек. Пожалуйста, войдите заново.";
    } else if (res.status === 400) {
      // Детальная обработка ошибок валидации (только в DEV)
      if (import.meta.env.DEV) {
        console.error(`[API] 400 Bad Request для ${method} ${url}`);
        console.error(`[API] Request body:`, body ? JSON.stringify(body, null, 2) : "нет тела");
        console.error(`[API] Response data:`, data);
      }
      
      if (data?.message) {
        errorMessage = `Ошибка валидации: ${data.message}`;
      } else if (data?.error) {
        errorMessage = `Ошибка валидации: ${data.error}`;
      } else if (Array.isArray(data?.errors)) {
        const errorsList = data.errors.map(e => e.message || e).join(", ");
        errorMessage = `Ошибки валидации: ${errorsList}`;
      } else if (typeof data === "string") {
        errorMessage = `Ошибка валидации: ${data}`;
      } else {
        errorMessage = `Ошибка валидации (400). Проверьте формат отправляемых данных.`;
      }
    } else if (data && (data.message || data.error)) {
      errorMessage = data.message || data.error;
    }
    
    const err = new Error(errorMessage);
    err.status = res.status;
    err.data = data;
    err.url = url;
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
  } catch (error) {
    // Логируем только для отладки в DEV, не показываем пользователю
    if (import.meta.env.DEV && error?.status === 404) {
      console.warn(`API endpoint не найден (404): ${path}. Используется fallback.`);
    }
    return null;
  }
}

export const AuthApi = {
  async register(user) {
    // Some deployments expose only POST /user; others have /auth/register.
    // Prefer /user to avoid 404 spam, fallback to /auth/register.
    try {
      return await apiFetch("/user", {
        method: "POST",
        body: user,
        auth: false,
      });
    } catch (e) {
      // Only fallback when the endpoint truly doesn't exist / method not allowed.
      // For real business/validation errors (409 conflict, 400 validation, etc) we MUST surface the original error.
      if (e?.status !== 404 && e?.status !== 405) throw e;
      return apiFetch("/auth/register", {
        method: "POST",
        body: user,
        auth: false,
      });
    }
  },
  async loginWithPassword({ email, password }) {
    // Standard endpoint: POST /auth/login (per API docs)
    try {
      return await apiFetch("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
    } catch {
      // Fallback for newer backends that use /auth/login/password
      return apiFetch("/auth/login/password", {
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
    // Normalize "current user" endpoint across backends
    // 1) Newer backends: GET /user/me
    // 2) Older spec in docs: GET /auth/profile
    // 3) Legacy: GET /user
    try {
      return await apiFetch("/user/me", { method: "GET", auth: true });
    } catch {
      try {
        return await apiFetch("/auth/profile", { method: "GET", auth: true });
      } catch {
        return apiFetch("/user", { method: "GET", auth: true });
      }
    }
  },
  async updateProfile(data) {
    // Update current user profile
    // Try PATCH /user/me first, then fallback to PATCH /user
    try {
      return await apiFetch("/user/me", { method: "PATCH", body: data, auth: true });
    } catch {
      try {
        return await apiFetch("/user", { method: "PATCH", body: data, auth: true });
      } catch {
        return apiFetch("/auth/profile", { method: "PATCH", body: data, auth: true });
      }
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

  /**
   * Перевод массива текстов одним запросом (меньше запросов → меньше 429).
   * При 429 возвращает исходные тексты.
   */
  async translateBatch(texts, from, to) {
    if (!Array.isArray(texts) || texts.length === 0) {
      return { translated: [], rateLimited: false };
    }
    try {
      const result = await apiFetch("/translation/translate-batch", {
        method: "POST",
        body: { texts, from, to },
        auth: true,
      });
      const translated = Array.isArray(result?.translated) ? result.translated : texts;
      return { translated, rateLimited: false };
    } catch (e) {
      if (e?.status === 429) {
        return { translated: texts, rateLimited: true };
      }
      return { translated: texts, rateLimited: false };
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
  async listStatuses() {
    return apiFetch("/appeals/statuses/all", { method: "GET", auth: false });
  },
  async listMine({ page = 1, limit = 50 } = {}) {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/appeals${suffix}`, { method: "GET", auth: true });
  },
  async listAll({ page = 1, limit = 100 } = {}) {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    // Убрали параметр "all=true", так как он вызывает ошибку валидации
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    // Сначала пробуем админский endpoint, если не работает - используем обычный
    try {
      return await apiFetch(`/appeals/admin${suffix}`, { method: "GET", auth: true });
    } catch {
      return apiFetch(`/appeals${suffix}`, { method: "GET", auth: true });
    }
  },
  async getById(id) {
    const sid = encodeURIComponent(String(id));
    return apiFetch(`/appeals/${sid}`, { method: "GET", auth: true });
  },
  async getHistory(id) {
    const sid = encodeURIComponent(String(id));
    return apiFetch(`/appeals/${sid}/history`, { method: "GET", auth: true });
  },
  async updateStatus(id, status, response) {
    // Backend expects PATCH /appeals/:id with { statusId } (number) and optionally { response } (string)
    let statusId = null;
    if (typeof status === "number") {
      statusId = status;
    } else if (status && typeof status === "object") {
      if (typeof status?.id === "number") statusId = status.id;
      else if (typeof status?.value === "number") statusId = status.value;
    } else if (typeof status === "string") {
      const want = status.trim().toLowerCase();
      const list = await this.listStatuses().catch(() => []);
      const arr = Array.isArray(list) ? list : Array.isArray(list?.items) ? list.items : [];
      const found = (arr || []).find((s) => {
        const name = String(s?.name || "").trim().toLowerCase();
        const code = String(s?.code || "").trim().toLowerCase();
        return name === want || code === want;
      });
      if (typeof found?.id === "number") statusId = found.id;
    }
    if (!statusId) {
      throw new Error("Не удалось определить ID статуса обращения");
    }
    const body = { statusId };
    if (response && typeof response === "string" && response.trim()) {
      body.response = response.trim();
    }
    return apiFetch(`/appeals/${id}`, { method: "PATCH", body, auth: true });
  },
  async uploadFiles(id, files) {
    const sid = encodeURIComponent(String(id));
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : files ? [files] : [];
    fileArray.forEach((file) => {
      if (file && (file instanceof File || file.originFileObj)) {
        formData.append("files", file.originFileObj || file);
      }
    });
    
    // Для FormData используем прямой fetch, так как apiFetch пытается сериализовать в JSON
    const url = API_BASE_URL.replace(/\/+$/, "") + "/" + `appeals/${sid}/files`.replace(/^\/+/, "");
    const token = getAuthToken();
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Не устанавливаем Content-Type - браузер сам установит с boundary для FormData
    
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const error = new Error(errorData?.message || `Request failed: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    
    return await res.json().catch(() => ({}));
  },
  async remove(id) {
    const sid = encodeURIComponent(String(id));
    // Some deployments expose admin-only delete under /appeals/admin/:id
    // even though Swagger might document /appeals/:id. Try admin path first.
    try {
      return await apiFetch(`/appeals/admin/${sid}`, { method: "DELETE", auth: true });
    } catch (e) {
      if (e?.status !== 404 && e?.status !== 405) throw e;
      return apiFetch(`/appeals/${sid}`, { method: "DELETE", auth: true });
    }
  },
};

export const AboutApi = {
  async listPages({ locale, publishedOnly = true } = {}) {
    // Backend /pages does NOT support locale filter in query.
    // We fetch list and then filter client-side by localized content locale.
    try {
      const qs = new URLSearchParams();
      if (publishedOnly) qs.set("publishedOnly", "true");
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      const res = await apiFetch(`/pages${suffix}`, { method: "GET", auth: false });
      const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
      if (!locale) return arr;
      const want = String(locale).toLowerCase();
      return arr.filter((p) => {
        const c = p?.content;
        if (Array.isArray(c)) return c.some((x) => String(x?.locale || "").toLowerCase() === want);
        // legacy single-content page: treat as RU by default
        return want === "ru";
      });
    } catch {
      // Fallback на старый endpoint
      const qs = new URLSearchParams();
      if (locale) qs.set("locale", locale);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return apiFetch(`/about/pages${suffix}`, { method: "GET", auth: false });
    }
  },
  async listPagesTree({ publishedOnly = true } = {}) {
    // Public tree: GET /pages?tree=true&publishedOnly=true|false
    const qs = new URLSearchParams();
    qs.set("tree", "true");
    if (publishedOnly) qs.set("publishedOnly", "true");
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/pages${suffix}`, { method: "GET", auth: false });
  },
  async getPageBySlug(slug, { locale } = {}) {
    try {
      return await apiFetch(`/pages/slug/${encodeURIComponent(slug)}`, {
        method: "GET",
        auth: false,
      });
    } catch (e) {
      // При 404 не делать второй запрос — страницы с таким slug нет
      if (e?.status === 404) return null;
      // Fallback на старый endpoint при других ошибках
      try {
        const qs = new URLSearchParams();
        if (locale) qs.set("locale", locale);
        const suffix = qs.toString() ? `?${qs.toString()}` : "";
        return await apiFetch(`/about/pages/${encodeURIComponent(slug)}${suffix}`, {
          method: "GET",
          auth: false,
        });
      } catch {
        return null;
      }
    }
  },
  async createPage(dto = {}) {
    // Swagger DTO: CreatePageDto { slug, title, content?: PageContentDto[], parentId?, order?, isPublished?, publishedAt? }
    const slug = String(dto?.slug || "").trim().replace(/^\/+|\/+$/g, "");
    const title = String(dto?.title || "").trim();
    const locale = String(dto?.locale || "ru").toLowerCase();
    const rawContent = dto?.content;

    const content = Array.isArray(rawContent)
      ? rawContent.map((c) => ({
          locale: String(c?.locale || locale || "ru").toLowerCase(),
          title: String(c?.title || title || "").trim(),
          description: c?.description ?? undefined,
          content: c?.content ?? null,
          blocks: Array.isArray(c?.blocks) ? c.blocks : undefined,
        }))
      : typeof rawContent === "string"
        ? [
            {
              locale,
              title,
              content: rawContent,
            },
          ]
        : undefined;

    const body = {
      slug,
      title,
      ...(content ? { content } : {}),
      ...(dto?.parentId !== undefined ? { parentId: dto.parentId } : {}),
      ...(dto?.order !== undefined ? { order: dto.order } : {}),
      ...(dto?.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      ...(dto?.publishedAt !== undefined ? { publishedAt: dto.publishedAt } : {}),
    };

    return apiFetch("/pages", { method: "POST", body, auth: true });
  },
  async updatePage(id, dto = {}) {
    const slug = dto?.slug !== undefined ? String(dto?.slug || "").trim().replace(/^\/+|\/+$/g, "") : undefined;
    const title = dto?.title !== undefined ? String(dto?.title || "").trim() : undefined;
    const locale = String(dto?.locale || "ru").toLowerCase();
    const rawContent = dto?.content;

    const content = Array.isArray(rawContent)
      ? rawContent.map((c) => ({
          locale: String(c?.locale || locale || "ru").toLowerCase(),
          title: String(c?.title || title || "").trim(),
          description: c?.description ?? undefined,
          content: c?.content ?? null,
          blocks: Array.isArray(c?.blocks) ? c.blocks : undefined,
        }))
      : typeof rawContent === "string"
        ? [
            {
              locale,
              title: String(title || "").trim(),
              content: rawContent,
            },
          ]
        : undefined;

    const body = {
      ...(slug !== undefined ? { slug } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(content ? { content } : {}),
      ...(dto?.parentId !== undefined ? { parentId: dto.parentId } : {}),
      ...(dto?.order !== undefined ? { order: dto.order } : {}),
      ...(dto?.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
      ...(dto?.publishedAt !== undefined ? { publishedAt: dto.publishedAt } : {}),
    };

    return apiFetch(`/pages/${encodeURIComponent(id)}`, { method: "PATCH", body, auth: true });
  },
  async deletePage(id) {
    // Согласно Swagger, endpoint - /pages/{id}
    return apiFetch(`/pages/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true,
    });
  },
  async listStructure() {
    return apiFetch("/about/structure", { method: "GET", auth: false });
  },
};

export const SitesApi = {
  async list() {
    const res = await apiFetch("/sites", { method: "GET", auth: false });
    return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
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

// Accessibility endpoints
export const AccessibilityApi = {
  async getSettings(sessionId) {
    // GET /accessibility/settings?sessionId=... - Получить настройки доступности
    const qs = new URLSearchParams();
    if (sessionId) qs.set("sessionId", sessionId);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch(`/accessibility/settings${suffix}`, { method: "GET", auth: true });
  },
  async saveSettings(data) {
    // POST /accessibility/settings - Сохранить настройки доступности
    return apiFetch("/accessibility/settings", {
      method: "POST",
      body: data,
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
    try {
      const result = await apiFetch("/persons/convocations/all", {
        method: "GET",
        auth: false,
      });
      return result;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("PersonsApi.listConvocationsAll: error:", e);
      }
      throw e;
    }
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
  async createMultipart(formData) {
    return apiFetchMultipart("/news", {
      method: "POST",
      formData,
      auth: true,
    });
  },
  async patch(id, body) {
    return apiFetch(`/news/${id}`, { method: "PATCH", body, auth: true });
  },
  async updateMultipart(id, formData) {
    return apiFetchMultipart(`/news/${id}`, {
      method: "PATCH",
      formData,
      auth: true,
    });
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
  async getAllCategories() {
    return apiFetch("/news/categories/all", { method: "GET", auth: false });
  },
  async createCategory(body) {
    return apiFetch("/news/categories", { method: "POST", body, auth: true });
  },
  async uploadCover(id, file) {
    const fd = new FormData();
    fd.append("cover", file);
    return apiFetchMultipart(`/news/${id}/cover`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async uploadGallery(id, files) {
    const fd = new FormData();
    const arr = Array.isArray(files) ? files : files ? [files] : [];
    arr.forEach((f) => fd.append("gallery", f));
    return apiFetchMultipart(`/news/${id}/gallery`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async deleteCover(id) {
    return apiFetch(`/news/${id}/cover`, { method: "DELETE", auth: true });
  },
  async deleteGalleryImage(id, fileId) {
    return apiFetch(`/news/${id}/gallery/${fileId}`, { method: "DELETE", auth: true });
  },
};

// Documents-related endpoints
export const DocumentsApi = {
  async list() {
    return apiFetch("/documents", { method: "GET", auth: false });
  },
  async listAll() {
    return apiFetch("/documents/all", { method: "GET", auth: true });
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
  async uploadFileTy(id, file) {
    const fd = new FormData();
    fd.append("pdf", file);
    return apiFetchMultipart(`/documents/${id}/pdf-ty`, {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
};

// Translation endpoints
export const TranslationApi = {
  async translateDocument(file, from, to) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("from", from);
    fd.append("to", to);
    return apiFetchMultipart("/translation/documents", {
      method: "POST",
      formData: fd,
      auth: true,
    });
  },
  async translateDocumentByFileId(fileId, from, to, documentId) {
    return apiFetch("/translation/documents/by-file-id", {
      method: "POST",
      body: { fileId, from, to, documentId },
      auth: true,
    });
  },
  async getTranslationStatus(jobId) {
    return apiFetch(`/translation/documents/${jobId}/status`, {
      method: "GET",
      auth: true,
    });
  },
};

// Calendar (events) endpoints — только календарь использует CALENDAR_API_BASE_URL (https://someshit.yurta.site/api)
const calendarFetch = (path, opts) =>
  apiFetch(path, { ...opts, baseUrl: CALENDAR_API_BASE_URL });

export const EventsApi = {
  async list(params) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return calendarFetch(`/calendar${qs}`, { method: "GET", auth: false });
  },
  async getByMonth(year, month) {
    return calendarFetch(`/calendar/month/${year}/${month}`, { method: "GET", auth: false });
  },
  async getByYear(year) {
    return calendarFetch(`/calendar/year/${year}`, { method: "GET", auth: false });
  },
  async getById(id) {
    return calendarFetch(`/calendar/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return calendarFetch("/calendar", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return calendarFetch(`/calendar/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return calendarFetch(`/calendar/${id}`, { method: "DELETE", auth: true });
  },
};

// Calendar event types endpoints — тот же API календаря
export const EventTypesApi = {
  async listAll() {
    return calendarFetch("/calendar/types/all", { method: "GET", auth: false });
  },
  async create(body) {
    return calendarFetch("/calendar/types", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return calendarFetch(`/calendar/types/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return calendarFetch(`/calendar/types/${id}`, { method: "DELETE", auth: true });
  },
};

// Settings endpoints
export const SettingsApi = {
  async getAll() {
    // GET /settings - Получить все настройки (только для администраторов)
    return apiFetch("/settings", { method: "GET", auth: true });
  },
  async update(data) {
    // PATCH /settings - Обновить настройки (только для администраторов)
    return apiFetch("/settings", { method: "PATCH", body: data, auth: true });
  },
  async getByKey(key) {
    // GET /settings/{key} - Получить настройку по ключу (только для администраторов)
    return apiFetch(`/settings/${key}`, { method: "GET", auth: true });
  },
  async setAppealsRecipientEmail(email) {
    // PATCH /settings/appeals-recipient-email - Установить email для получения уведомлений о новых обращениях
    return apiFetch("/settings/appeals-recipient-email", {
      method: "PATCH",
      body: { email },
      auth: true,
    });
  },
};

// Convocations (Созывы) endpoints
// API находится по пути /persons/convocations согласно Swagger
export const ConvocationsApi = {
  async list({ activeOnly = false } = {}) {
    try {
      // Сначала пробуем /all (устойчивее для бэкенда)
      let all;
      try {
        all = await PersonsApi.listConvocationsAll();
      } catch (e1) {
        if (import.meta.env.DEV) {
          console.warn("ConvocationsApi.list: /all failed, trying /persons/convocations:", e1);
        }
        try {
          const qs = new URLSearchParams();
          if (activeOnly) qs.set("activeOnly", "true");
          const suffix = qs.toString() ? `?${qs.toString()}` : "";
          all = await apiFetch(`/persons/convocations${suffix}`, { method: "GET", auth: false });
        } catch (e2) {
          if (import.meta.env.DEV) {
            console.error("ConvocationsApi.list: both endpoints failed:", e2);
          }
          return [];
        }
      }
      
      if (!Array.isArray(all)) {
        if (import.meta.env.DEV) {
          console.warn("ConvocationsApi.list: API returned non-array:", all);
        }
        // Попробуем нормализовать
        // Попробуем извлечь данные из объекта
        if (all && typeof all === 'object') {
          if (Array.isArray(all.convocations)) {
            // Созывы могут быть в поле convocations (например, из /persons/{id})
            all = all.convocations;
          } else if (Array.isArray(all.data)) {
            all = all.data;
          } else if (Array.isArray(all.items)) {
            all = all.items;
          } else if (Array.isArray(all.results)) {
            all = all.results;
          } else {
            return [];
          }
        } else {
          return [];
        }
      }
      
      // Фильтруем по активности, если нужно
      if (activeOnly) {
        return all.filter((c) => {
          const v = c?.isActive;
          // Treat string/number false as false as well
          return !(v === false || v === 0 || v === "0" || String(v).toLowerCase() === "false");
        });
      }
      return all;
    } catch (e) {
      if (import.meta.env.DEV) {
        console.error("ConvocationsApi.list: unexpected error:", e);
      }
      return [];
    }
  },
  async getById(id) {
    if (id == null || id === "") return null;
    const idStr = String(id);
    try {
      const res = await apiFetch(`/persons/convocations/${encodeURIComponent(idStr)}`, { method: "GET", auth: false });
      if (res && typeof res === "object") return res;
    } catch (e) {
      if (import.meta.env.DEV && e?.status !== 404) {
        console.warn("ConvocationsApi.getById: fetch by id failed, falling back to list:", e);
      }
    }
    const all = await this.list({ activeOnly: false });
    return Array.isArray(all) ? all.find(c => String(c?.id ?? "") === idStr) : null;
  },
  async create(body) {
    return apiFetch("/persons/convocations", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    // API использует PUT, а не PATCH согласно Swagger
    return apiFetch(`/persons/convocations/${id}`, { method: "PUT", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/persons/convocations/${id}`, { method: "DELETE", auth: true });
  },
};

// Committees (Комитеты) endpoints
export const CommitteesApi = {
  async list({ all = false, convocationId } = {}) {
    const qs = new URLSearchParams();
    if (all) qs.set("all", "true");
    if (convocationId) qs.set("convocationId", String(convocationId));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    const result = await apiFetch(`/committees${suffix}`, { method: "GET", auth: false });
    // Если результат обернут в объект, извлекаем массив
    if (result && typeof result === "object" && !Array.isArray(result)) {
      if (Array.isArray(result.data)) {
        return result.data;
      }
      if (Array.isArray(result.committees)) {
        return result.committees;
      }
    }
    return result;
  },
  async getById(id) {
    return apiFetch(`/committees/${id}`, { method: "GET", auth: false });
  },
  async create(body) {
    return apiFetch("/committees", { method: "POST", body, auth: true });
  },
  async patch(id, body) {
    return apiFetch(`/committees/${id}`, { method: "PATCH", body, auth: true });
  },
  async remove(id) {
    return apiFetch(`/committees/${id}`, { method: "DELETE", auth: true });
  },
  async addMembers(id, members) {
    return apiFetch(`/committees/${id}/members`, {
      method: "POST",
      body: members,
      auth: true,
    });
  },
  async removeMember(id, memberId) {
    return apiFetch(`/committees/${id}/members/${memberId}`, {
      method: "DELETE",
      auth: true,
    });
  },
  async reorder(ids) {
    return apiFetch("/committees/reorder", {
      method: "POST",
      body: { ids },
      auth: true,
    });
  },
};
