import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

function safeNextPath(next) {
  const n = String(next || "");
  // Allow only in-app paths
  if (!n.startsWith("/")) return "/";
  if (n.startsWith("//")) return "/";
  return n;
}

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const { navigate } = useHashRoute();
  const redirectRef = React.useRef(false);
  const lastRouteRef = React.useRef("");

  React.useEffect(() => {
    if (isAuthenticated) {
      redirectRef.current = false;
      lastRouteRef.current = "";
      return;
    }
    
    // Get current route without subscribing to route changes
    const currentRoute = typeof window !== "undefined" 
      ? window.location.pathname + window.location.search 
      : "/";
    const base = currentRoute.split("?")[0] || "/";
    
    // Don't redirect if already on login page or if we already redirected to the same route
    if (base === "/login" || (redirectRef.current && lastRouteRef.current === base)) {
      return;
    }
    
    const next = safeNextPath(base);
    redirectRef.current = true;
    lastRouteRef.current = base;
    navigate(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}



