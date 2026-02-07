import React from "react";
import { AccessibilityApi } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const A11yContext = React.createContext({
  mode: "normal",
  fontScale: 1,
  disableAnimations: false,
  cycleMode: () => {},
  setFontScale: () => {},
  setMode: () => {},
  setDisableAnimations: () => {},
});
export function useA11y() {
  return React.useContext(A11yContext);
}

function apply(mode, fontScale, disableAnimations) {
  const b = document.body;
  b.classList.remove("hc-bw", "hc-yb", "a11y-no-motion");
  if (mode === "bw") b.classList.add("hc-bw");
  if (mode === "yb") b.classList.add("hc-yb");
  if (disableAnimations) b.classList.add("a11y-no-motion");
  b.style.setProperty("--font-scale", String(fontScale));
}

function applyDataToState(data, setMode, setFontScale, setDisableAnimations) {
  if (!data || typeof data !== "object") return;
  const contrast = String(data.contrast || "").toLowerCase();
  const colorScheme = String(data.colorScheme || "").toLowerCase();
  const nextMode =
    contrast === "high" || colorScheme === "high"
      ? "bw"
      : colorScheme === "yb"
        ? "yb"
        : "normal";
  if (nextMode === "bw" || nextMode === "yb" || nextMode === "normal") {
    setMode(nextMode);
  }
  const fs = Number(data.fontSize || 16);
  if (!Number.isNaN(fs) && fs > 0) {
    setFontScale(Math.max(0.75, Math.min(1.5, fs / 16)));
  }
  if (data.disableAnimations !== undefined) {
    setDisableAnimations(Boolean(data.disableAnimations));
  }
}

export default function A11yProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = React.useState("normal"); // normal | bw | yb
  const [fontScale, setFontScale] = React.useState(1);
  const [disableAnimations, setDisableAnimations] = React.useState(false);

  React.useEffect(() => {
    apply(mode, fontScale, disableAnimations);
  }, [mode, fontScale, disableAnimations]);

  const loadSettingsFromApi = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const s = await AccessibilityApi.getSettings().catch(() => null);
      const data = s?.settings || s?.data || s;
      if (!data) return;
      applyDataToState(data, setMode, setFontScale, setDisableAnimations);
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadSettingsFromApi();
  }, [loadSettingsFromApi]);

  React.useEffect(() => {
    const handleUpdate = (e) => {
      const detail = e?.detail;
      if (detail != null && typeof detail === "object") {
        const data = detail?.settings || detail?.data || detail;
        applyDataToState(data, setMode, setFontScale, setDisableAnimations);
      } else {
        loadSettingsFromApi();
      }
    };
    window.addEventListener("accessibility-settings-updated", handleUpdate);
    return () => window.removeEventListener("accessibility-settings-updated", handleUpdate);
  }, [loadSettingsFromApi]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const id = setTimeout(() => {
      const payload = {
        fontSize: Math.round(16 * fontScale),
        colorScheme: mode === "yb" ? "yb" : "default",
        contrast: mode === "bw" ? "high" : "normal",
        disableAnimations,
      };
      AccessibilityApi.saveSettings(payload).catch(() => null);
    }, 500);
    return () => clearTimeout(id);
  }, [isAuthenticated, mode, fontScale, disableAnimations]);

  const cycleMode = React.useCallback(() => {
    setMode((m) => (m === "normal" ? "bw" : m === "bw" ? "yb" : "normal"));
  }, []);

  const value = React.useMemo(
    () => ({
      mode,
      fontScale,
      disableAnimations,
      cycleMode,
      setFontScale,
      setMode,
      setDisableAnimations,
    }),
    [mode, fontScale, disableAnimations, cycleMode]
  );
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}
