import React from "react";
import { BROADCAST_LINKS } from "../content/broadcasts.js";

/** Список ссылок на трансляции. Использует только статические данные BROADCAST_LINKS. */
export function useBroadcastLinks() {
  // Возвращаем статические данные без запросов к API
  // API endpoint /settings/broadcast_links требует авторизацию, поэтому не используем его
  return { links: BROADCAST_LINKS, loading: false };
}
