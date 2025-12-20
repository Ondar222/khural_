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

    window.addEventListener("popstate", onPopState);
    window.addEventListener("app:navigate", onNavigate);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("app:navigate", onNavigate);
      window.removeEventListener("hashchange", onHashChange);
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
