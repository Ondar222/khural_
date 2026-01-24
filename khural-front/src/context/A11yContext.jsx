import React from "react";
import { AccessibilityApi } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";

const A11yContext = React.createContext({
  mode: "normal",
  fontScale: 1,
  cycleMode: () => {},
  setFontScale: () => {},
});
export function useA11y() {
  return React.useContext(A11yContext);
}

function apply(mode, fontScale) {
  const b = document.body;
  b.classList.remove("hc-bw", "hc-yb");
  if (mode === "bw") b.classList.add("hc-bw");
  if (mode === "yb") b.classList.add("hc-yb");
  b.style.setProperty("--font-scale", String(fontScale));
}

export default function A11yProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = React.useState("normal"); // normal | bw | yb
  const [fontScale, setFontScale] = React.useState(1);

  React.useEffect(() => {
    apply(mode, fontScale);
  }, [mode, fontScale]);

  const loadSettingsFromApi = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const s = await AccessibilityApi.getSettings().catch(() => null);
      const data = s?.settings || s?.data || s;
      if (!data) return;
      // Map backend fields to UI:
      // - colorScheme/contrast are simplified to our modes
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
        // base 16px => scale 1
        setFontScale(Math.max(0.85, Math.min(1.6, fs / 16)));
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // Load settings from API when user is authenticated
  React.useEffect(() => {
    loadSettingsFromApi();
  }, [loadSettingsFromApi]);

  // Listen for settings updates from other components
  React.useEffect(() => {
    const handleUpdate = () => {
      loadSettingsFromApi();
    };
    window.addEventListener("accessibility-settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("accessibility-settings-updated", handleUpdate);
    };
  }, [loadSettingsFromApi]);

  // Save settings (debounced) to API when user is authenticated
  React.useEffect(() => {
    if (!isAuthenticated) return;
    const id = setTimeout(() => {
      const fontSize = Math.round(16 * fontScale);
      const payload = {
        fontSize,
        colorScheme: mode === "yb" ? "yb" : mode === "bw" ? "default" : "default",
        contrast: mode === "bw" ? "high" : "normal",
        disableAnimations: false,
      };
      AccessibilityApi.saveSettings(payload).catch(() => null);
    }, 500);
    return () => clearTimeout(id);
  }, [isAuthenticated, mode, fontScale]);

  const cycleMode = React.useCallback(() => {
    setMode((m) => (m === "normal" ? "bw" : m === "bw" ? "yb" : "normal"));
  }, []);

  const value = React.useMemo(
    () => ({ mode, fontScale, cycleMode, setFontScale }),
    [mode, fontScale, cycleMode]
  );
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}
