import React from "react";

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
  const [mode, setMode] = React.useState("normal"); // normal | bw | yb
  const [fontScale, setFontScale] = React.useState(1);

  React.useEffect(() => {
    apply(mode, fontScale);
  }, [mode, fontScale]);

  const cycleMode = React.useCallback(() => {
    setMode((m) => (m === "normal" ? "bw" : m === "bw" ? "yb" : "normal"));
  }, []);

  const value = React.useMemo(
    () => ({ mode, fontScale, cycleMode, setFontScale }),
    [mode, fontScale, cycleMode]
  );
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}
