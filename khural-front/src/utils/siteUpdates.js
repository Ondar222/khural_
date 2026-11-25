/**
 * Уведомления об изменении шапки/подвала/меню.
 *
 * Раньше использовались только window-события: изменения появлялись в той же
 * вкладке, но уже открытые вкладки сайта оставались со старым меню/подвалом.
 * Дополнительно рассылаем BroadcastChannel и storage-событие, чтобы публичная
 * часть обновлялась автоматически во всех открытых вкладках одного браузера.
 */
const CHANNEL_NAME = "khural-site-updates";
const SITE_KEY = "khural:site-updated-at";
const MENU_KEY = "khural:menu-updated-at";

let sendChannel = null;

function getSendChannel() {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!sendChannel) {
    try {
      sendChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return sendChannel;
}

export function notifySiteUpdated(kind = "site") {
  const isMenu = kind === "menu";
  const eventName = isMenu ? "khural:menu-updated" : "khural:site-updated";
  window.dispatchEvent(new CustomEvent(eventName));
  try {
    localStorage.setItem(isMenu ? MENU_KEY : SITE_KEY, String(Date.now()));
  } catch {
    // Приватный режим/запрет localStorage — оставляем только window-событие.
  }
  getSendChannel()?.postMessage({ kind: isMenu ? "menu" : "site" });
}

export function subscribeSiteUpdates(handler) {
  const onSite = () => handler("site");
  const onMenu = () => handler("menu");
  const onStorage = (event) => {
    if (event.key === MENU_KEY) handler("menu");
    else if (event.key === SITE_KEY) handler("site");
  };

  window.addEventListener("khural:site-updated", onSite);
  window.addEventListener("khural:menu-updated", onMenu);
  window.addEventListener("storage", onStorage);

  let channel = null;
  if (typeof BroadcastChannel !== "undefined") {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => handler(event?.data?.kind === "menu" ? "menu" : "site");
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener("khural:site-updated", onSite);
    window.removeEventListener("khural:menu-updated", onMenu);
    window.removeEventListener("storage", onStorage);
    if (channel) channel.close();
  };
}
