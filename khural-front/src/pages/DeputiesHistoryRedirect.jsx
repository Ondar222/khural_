import React from "react";
import { mapOldSiteConvocationIdToCanonical, CANONICAL_CONVOCATIONS } from "../utils/convocationLabels.js";

/**
 * Редирект с URL «депутаты по созыву» (как на старом сайте khural.rtyva.ru) на страницу депутатов с фильтром.
 * Маршруты: /deputies/history/I, /deputies/history/II, /deputies/history/83 (83→I) и т.д.
 */
export default function DeputiesHistoryRedirect() {
  const convocationToken =
    typeof window !== "undefined" && window.__routeParams && window.__routeParams.convocationToken
      ? window.__routeParams.convocationToken
      : "";
  const token = React.useMemo(() => {
    const raw = String(convocationToken || "").trim();
    if (!raw) return null;
    const oldMapped = mapOldSiteConvocationIdToCanonical(raw);
    if (oldMapped) return oldMapped;
    const upper = raw.toUpperCase();
    if (CANONICAL_CONVOCATIONS.includes(upper)) return upper;
    return null;
  }, [convocationToken]);

  React.useEffect(() => {
    const target = token ? `/deputies?convocation=${encodeURIComponent(token)}` : "/deputies";
    window.location.replace(target);
  }, [token]);

  return (
    <div className="section container" style={{ padding: "2rem", textAlign: "center" }}>
      <p>Переход к списку депутатов…</p>
    </div>
  );
}
