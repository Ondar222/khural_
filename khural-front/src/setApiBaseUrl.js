// Рантайм-переопределение базы API. Подключается раньше всего остального (импорт в main.jsx),
// src/api/client.js берёт window.__API_BASE_URL__ первым приоритетом.
//
// Когда nginx режет префикс /api при проксировании, можно добавить сюда хост,
// чтобы фронт ходил на /api/api (удвоенный префикс). Если nginx передаёт путь целиком —
// массив должен быть пустым.
const DOUBLE_API_PATH_HOSTS = [];

function isDoubleApiPathHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return DOUBLE_API_PATH_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function isLocalhost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "";
}

(() => {
  if (typeof window === "undefined") return;

  // Явное переопределение всегда важнее авто-логики.
  if (window.__API_BASE_URL__) return;
  if (String(import.meta?.env?.VITE_API_BASE_URL || "").trim()) return;

  const hostname = window.location?.hostname;

  // Локальная разработка: /api проксируется Vite на локальный бэкенд.
  if (isLocalhost(hostname)) return;

  if (!isDoubleApiPathHost(hostname)) return;

  window.__API_BASE_URL__ = "/api";
})();

