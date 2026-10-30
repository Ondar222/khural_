import React from "react";
import { BROADCAST_LINKS } from "../content/broadcasts.js";
import { BroadcastsApi } from "../api/client.js";
import { normalizeApiBroadcasts, normalizeStaticBroadcasts } from "../content/broadcasts.js";

/**
 * Список ссылок на трансляции для архива на главной и /broadcast.
 * Приоритет: публичный /api/broadcasts, fallback — BROADCAST_LINKS.
 */
export function useBroadcastLinks() {
  const [links, setLinks] = React.useState(BROADCAST_LINKS);
  const [items, setItems] = React.useState(() => normalizeStaticBroadcasts(BROADCAST_LINKS));
  const [loading, setLoading] = React.useState(true);
  const requestId = React.useRef(0);

  const reload = React.useCallback(async () => {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    let loadedFromApi = false;
    try {
      const list = await BroadcastsApi.listPublic();
      const normalized = normalizeApiBroadcasts(list);
      if (normalized.length > 0) {
        if (currentRequestId === requestId.current) {
          setItems(normalized);
          setLinks(normalized.map((b) => b.url));
        }
        loadedFromApi = true;
      }
    } catch {
      // Retain the static archive if the public broadcasts endpoint is unavailable.
    } finally {
      if (currentRequestId === requestId.current) {
        if (!loadedFromApi) {
          const fallback = normalizeStaticBroadcasts(BROADCAST_LINKS);
          setItems(fallback);
          setLinks(fallback.map((b) => b.url));
        }
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    reload();
    return () => {
      requestId.current += 1;
    };
  }, [reload]);

  return { links, items, loading, reload };
}
