import React from "react";
import { AccessibilityApi } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";
import { A11Y_DEFAULT_SETTINGS, normalizeSettings } from "../utils/a11ySettings.js";

function apply(settings) {
  const body = document.body;
  body.classList.remove(
    "hc-bw",
    "hc-yb",
    "a11y-dark",
    "a11y-blue",
    "a11y-brown",
    "a11y-high-contrast",
    "a11y-no-motion"
  );

  if (settings.colorScheme === "yb") {
    body.classList.add("hc-yb");
  } else if (["dark", "blue", "brown"].includes(settings.colorScheme)) {
    body.classList.add(`a11y-${settings.colorScheme}`);
  }
  if (settings.contrast === "high") {
    body.classList.add("hc-bw", "a11y-high-contrast");
  }
  if (settings.disableAnimations) {
    body.classList.add("a11y-no-motion");
  }

  // --font-scale остаётся для старых правил, но основной размер теперь
  // выставляется в px: 19px в настройках должен быть именно 19px на странице.
  body.style.setProperty("--font-scale", String(settings.fontSize / 15));
  body.style.fontSize = `${settings.fontSize}px`;
}

function toMode(settings) {
  if (settings.contrast === "high") return "bw";
  if (settings.colorScheme === "yb") return "yb";
  return "normal";
}

const A11yContext = React.createContext({
  ...A11Y_DEFAULT_SETTINGS,
  fontScale: 1,
  mode: "normal",
  cycleMode: () => {},
  setFontScale: () => {},
  setMode: () => {},
  setDisableAnimations: () => {},
  setAccessibility: () => {},
});

export function useA11y() {
  return React.useContext(A11yContext);
}

export default function A11yProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = React.useState(() => ({
    ...A11Y_DEFAULT_SETTINGS,
  }));
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    apply(settings);
  }, [settings]);

  const setAccessibility = React.useCallback((patch) => {
    setSettings((previous) => normalizeSettings(patch, previous));
  }, []);

  const loadSettingsFromApi = React.useCallback(async () => {
    if (!isAuthenticated) {
      setHydrated(true);
      return;
    }
    try {
      const response = await AccessibilityApi.getSettings().catch(() => null);
      const data = response?.settings || response?.data || response;
      if (data && typeof data === "object") {
        setSettings((previous) => normalizeSettings(data, previous));
      }
    } catch {
      // Ignore network errors: local defaults remain active.
    } finally {
      setHydrated(true);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    loadSettingsFromApi();
  }, [loadSettingsFromApi]);

  React.useEffect(() => {
    const handleUpdate = (event) => {
      const detail = event?.detail;
      const data = detail?.settings || detail?.data || detail;
      if (data && typeof data === "object") {
        setSettings((previous) => normalizeSettings(data, previous));
      } else {
        loadSettingsFromApi();
      }
    };
    window.addEventListener("accessibility-settings-updated", handleUpdate);
    return () => window.removeEventListener("accessibility-settings-updated", handleUpdate);
  }, [loadSettingsFromApi]);

  React.useEffect(() => {
    if (!isAuthenticated || !hydrated) return undefined;
    const timeout = setTimeout(() => {
      AccessibilityApi.saveSettings({
        fontSize: settings.fontSize,
        colorScheme: settings.colorScheme,
        contrast: settings.contrast,
        disableAnimations: settings.disableAnimations,
      }).catch(() => null);
    }, 500);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, hydrated, settings]);

  // Обратная совместимость со старыми потребителями контекста.
  const setFontScale = React.useCallback(
    (scale) => {
      const number = Number(scale);
      if (!Number.isFinite(number)) return;
      setAccessibility({ fontSize: Math.round(16 * number) });
    },
    [setAccessibility]
  );

  const setMode = React.useCallback(
    (mode) => {
      const value = String(mode || "").toLowerCase();
      if (value === "bw") {
        setAccessibility({ contrast: "high", colorScheme: "default" });
      } else if (value === "yb") {
        setAccessibility({ contrast: "normal", colorScheme: "yb" });
      } else {
        setAccessibility({ contrast: "normal", colorScheme: "default" });
      }
    },
    [setAccessibility]
  );

  const setDisableAnimations = React.useCallback(
    (value) => {
      setAccessibility({ disableAnimations: value });
    },
    [setAccessibility]
  );

  const cycleMode = React.useCallback(() => {
    setSettings((previous) => {
      const mode = toMode(previous);
      if (mode === "normal") return { ...previous, contrast: "high", colorScheme: "default" };
      if (mode === "bw") return { ...previous, contrast: "normal", colorScheme: "yb" };
      return { ...previous, contrast: "normal", colorScheme: "default" };
    });
  }, []);

  const value = React.useMemo(
    () => ({
      ...settings,
      fontScale: settings.fontSize / 16,
      mode: toMode(settings),
      cycleMode,
      setFontScale,
      setMode,
      setDisableAnimations,
      setAccessibility,
    }),
    [settings, cycleMode, setFontScale, setMode, setDisableAnimations, setAccessibility]
  );

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}
