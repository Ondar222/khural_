import React from "react";
import Deputies from "./DeputiesV2.jsx";

/**
 * Public page alias for "ended mandate" deputies.
 * Ensures we open the DeputiesV2 page with status=ended (and convocation=Все by default).
 */
export default function DeputiesEnded() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search || "");
    let changed = false;

    if (!sp.get("status")) {
      sp.set("status", "ended");
      changed = true;
    }
    if (!sp.get("convocation")) {
      sp.set("convocation", "Все");
      changed = true;
    }

    if (changed) {
      const next = `/deputies/ended?${sp.toString()}`;
      window.history.replaceState({}, "", next);
      window.dispatchEvent(new Event("popstate"));
    }
  }, []);

  return <Deputies />;
}

