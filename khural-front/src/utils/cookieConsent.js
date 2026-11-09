/**
 * Согласие пользователя на обработку cookie-файлов.
 *
 * Решение хранится локально в браузере (localStorage), на сервер не передаётся:
 * сайт не использует рекламных и счётчиковых скриптов, файлы cookie нужны
 * только для работы самого сайта и подключаемых сторонних виджетов.
 *
 * CONSENT_VERSION повышает смысл политики: при её изменении форма согласия
 * показывается повторно, чтобы пользователь подтвердил выбор заново.
 */
const STORAGE_KEY = "khural_cookie_consent_v1";
const CHANGE_EVENT = "khural:cookie-consent-changed";
const OPEN_EVENT = "khural:cookie-consent-open";
const CONSENT_VERSION = 1;

/** Категории cookie. necessary всегда включены и не снимается. */
export const COOKIE_CATEGORIES = [
  {
    id: "necessary",
    required: true,
    title: "Необходимые",
    description:
      "Обеспечивают работу сайта: запоминание языка, версии для слабовидящих, вход в личный кабинет.",
  },
  {
    id: "thirdParty",
    required: false,
    title: "Сторонние сервисы",
    description:
      "Виджет ВКонтакте, виджет Госуслуг и видеотрансляции. Без согласия они не загружаются.",
  },
  {
    id: "statistics",
    required: false,
    title: "Статистика",
    description: "Счётчики посещаемости и обезличенная аналитика, если они подключаются на сайте.",
  },
];

const OPTIONAL_IDS = COOKIE_CATEGORIES.filter((c) => !c.required).map((c) => c.id);

function emptySelection() {
  const selection = {};
  COOKIE_CATEGORIES.forEach((category) => {
    selection[category.id] = Boolean(category.required);
  });
  return selection;
}

function normalizeSelection(raw) {
  const selection = emptySelection();
  if (!raw || typeof raw !== "object") return selection;
  OPTIONAL_IDS.forEach((id) => {
    selection[id] = raw[id] === true;
  });
  return selection;
}

function dispatch(eventName) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event(eventName));
  } catch {
    // ignore
  }
}

/** Сохранённое согласие или null, если пользователь ещё не выбирал / версия устарела. */
export function readCookieConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (Number(parsed.version) !== CONSENT_VERSION) return null;
    return {
      version: CONSENT_VERSION,
      updatedAt: String(parsed.updatedAt || ""),
      categories: normalizeSelection(parsed.categories),
    };
  } catch {
    return null;
  }
}

/** Есть ли актуальное сохранённое решение пользователя. */
export function hasCookieConsent() {
  return readCookieConsent() !== null;
}

/** Включена ли категория (необходимые считаются включёнными всегда). */
export function isCookieCategoryEnabled(id) {
  const category = COOKIE_CATEGORIES.find((c) => c.id === id);
  if (category?.required) return true;
  const consent = readCookieConsent();
  return consent ? consent.categories?.[id] === true : false;
}

export function saveCookieConsent(categories) {
  if (typeof window === "undefined") return null;
  const record = {
    version: CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    categories: normalizeSelection(categories),
  };
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Приватный режим браузера: решение не сохранится, но форма закроется на этой сессии.
  }
  dispatch(CHANGE_EVENT);
  return record;
}

export function acceptAllCookieConsent() {
  const all = emptySelection();
  OPTIONAL_IDS.forEach((id) => {
    all[id] = true;
  });
  return saveCookieConsent(all);
}

export function rejectOptionalCookieConsent() {
  return saveCookieConsent(emptySelection());
}

/** Сброс согласия (используется админом при смене политики). */
export function clearCookieConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  dispatch(CHANGE_EVENT);
}

/** Открыть форму согласия из любого места сайта (например, из «подвала»). */
export function openCookieSettings() {
  dispatch(OPEN_EVENT);
}

export const COOKIE_CONSENT_CHANGE_EVENT = CHANGE_EVENT;
export const COOKIE_CONSENT_OPEN_EVENT = OPEN_EVENT;
export const COOKIE_CONSENT_STORAGE_KEY = STORAGE_KEY;
