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
  const { route, navigate } = useHashRoute();

  React.useEffect(() => {
    if (isAuthenticated) return;
    const base = (route || "/").split("?")[0] || "/";
    const next = safeNextPath(base);
    navigate(`/login?next=${encodeURIComponent(next)}`);
  }, [isAuthenticated, route, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}



