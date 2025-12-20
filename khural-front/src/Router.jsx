import React from "react";

function getRouteFromLocation() {
  if (typeof window === "undefined") return "/";
  const pathname = window.location.pathname || "/";
  const search = window.location.search || "";
  return `${pathname}${search}`;
}

function normalizeHashToHistory() {
  // Backward compatibility:
  // if user opens an old URL like "/#/news?id=1" or clicks a "#/..." link,
  // convert it to "/news?id=1".
  const hash = (typeof window !== "undefined" && window.location.hash) || "";
  if (hash.startsWith("#/")) {
    const target = hash.slice(1); // "/news?id=1"
    window.history.replaceState({}, "", target);
    return true;
  }
  return false;
}

export function useHashRoute() {
  const [route, setRoute] = React.useState(() => {
    normalizeHashToHistory();
    return getRouteFromLocation();
  });

  React.useEffect(() => {
    const update = () => setRoute(getRouteFromLocation());

    const onPopState = () => update();
    const onNavigate = () => update();
    const onHashChange = () => {
      if (normalizeHashToHistory()) {
        window.dispatchEvent(new Event("app:navigate"));
      } else {
        update();
      }
    };

    const onDocumentClick = (e) => {
      // Intercept plain left-clicks on internal links to avoid full page reloads.
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const a = e.target?.closest ? e.target.closest("a") : null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      if (a.getAttribute("rel")?.includes("external")) return;
      if (a.dataset && a.dataset.noSpa === "1") return;

      const href = a.getAttribute("href") || "";
      if (!href) return;
      // Allow in-page anchors
      if (href.startsWith("#") && !href.startsWith("#/")) return;

      // Convert old hash routes to history routes
      if (href.startsWith("#/")) {
        e.preventDefault();
        const target = href.slice(1); // "/path?x=1"
        window.history.pushState({}, "", target);
        window.dispatchEvent(new Event("app:navigate"));
        return;
      }

      // Only intercept same-origin relative/absolute paths
      if (href.startsWith("/")) {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new Event("app:navigate"));
        return;
      }

      // Absolute URL: intercept only if same origin
      if (href.startsWith("http://") || href.startsWith("https://")) {
        try {
          const url = new URL(href);
          if (url.origin !== window.location.origin) return;
          e.preventDefault();
          window.history.pushState({}, "", url.pathname + url.search + url.hash);
          window.dispatchEvent(new Event("app:navigate"));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("app:navigate", onNavigate);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onDocumentClick, true);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("app:navigate", onNavigate);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, []);

  const navigate = (path) => {
    const target = typeof path === "string" ? path : String(path || "");
    if (!target) return;
    if (target.startsWith("#")) {
      window.location.hash = target;
      return;
    }
    window.history.pushState({}, "", target);
    window.dispatchEvent(new Event("app:navigate"));
  };

  return { route, navigate };
}

export default function Router({ routes }) {
  const { route } = useHashRoute();
  const base = route.split("?")[0];
  const Component = routes[base] || routes["*"] || routes["/"];
  React.useEffect(() => {
    // Always scroll to top on route change (desktop & mobile)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [base]);
  return <Component />;
}
