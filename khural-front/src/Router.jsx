import React from "react";
import DeputiesV2 from "./pages/DeputiesV2.jsx";

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

  const navigate = React.useCallback((path) => {
    const target = typeof path === "string" ? path : String(path || "");
    if (!target) return;
    if (target.startsWith("#")) {
      window.location.hash = target;
      return;
    }
    window.history.pushState({}, "", target);
    window.dispatchEvent(new Event("app:navigate"));
  }, []);

  return React.useMemo(() => ({ route, navigate }), [route, navigate]);
}

function matchRoute(path, routePattern) {
  // Exact match
  if (routePattern === path) return { match: true, params: {} };
  
  // Check if route pattern has parameters (e.g., "/admin/news/edit/:id")
  if (!routePattern.includes(":")) return null;
  
  // Convert pattern to regex
  const patternParts = routePattern.split("/");
  const pathParts = path.split("/");
  
  if (patternParts.length !== pathParts.length) return null;
  
  const params = {};
  let match = true;
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];
    
    if (patternPart.startsWith(":")) {
      // This is a parameter
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      match = false;
      break;
    }
  }
  
  return match ? { match: true, params } : null;
}

export default function Router({ routes }) {
  const { route } = useHashRoute();
  const base = route.split("?")[0];
  
  // First try exact match
  let Component = routes[base];
  let routeParams = {};

  // Hotfix: allow deputies list to include admin-created updates without touching root-owned `App.jsx`
  if (base === "/deputies") {
    Component = DeputiesV2;
  }
  
  // If no exact match, try pattern matching
  // Sort routes to check patterns with parameters first (more specific routes first)
  if (!Component) {
    const routeEntries = Object.entries(routes);
    // Sort: patterns with : come first, then exact matches, then wildcards
    const sortedRoutes = routeEntries.sort(([a], [b]) => {
      const aHasParam = a.includes(":");
      const bHasParam = b.includes(":");
      if (aHasParam && !bHasParam) return -1;
      if (!aHasParam && bHasParam) return 1;
      if (a === "*") return 1;
      if (b === "*") return -1;
      if (a === "/") return 1;
      if (b === "/") return -1;
      // For patterns with params, prefer longer/more specific ones
      if (aHasParam && bHasParam) {
        return b.split("/").length - a.split("/").length;
      }
      return 0;
    });
    
    for (const [pattern, comp] of sortedRoutes) {
      if (pattern === "*" || pattern === "/") continue;
      const matchResult = matchRoute(base, pattern);
      if (matchResult && matchResult.match) {
        Component = comp;
        routeParams = matchResult.params || {};
        // Store params for components to access - set immediately
        if (typeof window !== "undefined") {
          if (Object.keys(routeParams).length > 0) {
            window.__routeParams = routeParams;
          } else {
            delete window.__routeParams;
          }
        }
        break;
      }
    }
  } else {
    // Clear params if exact match
    if (typeof window !== "undefined") {
      delete window.__routeParams;
    }
  }
  
  // Fallback to wildcard or root
  if (!Component) {
    Component = routes["*"] || routes["/"];
    if (typeof window !== "undefined") {
      delete window.__routeParams;
    }
  }
  
  React.useEffect(() => {
    // Always scroll to top on route change (desktop & mobile)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [base]);
  
  return Component ? <Component /> : null;
}
