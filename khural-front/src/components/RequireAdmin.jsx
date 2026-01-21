import React from "react";
import { message } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

function safeNextPath(next) {
  const n = String(next || "");
  if (!n.startsWith("/")) return "/";
  if (n.startsWith("//")) return "/";
  return n;
}

function isAdminUser(u) {
  const role = String(u?.role || "").toLowerCase();
  return Boolean(u?.admin) || role === "admin";
}

export default function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { navigate } = useHashRoute();
  const warnedRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated) {
      const currentRoute =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
      const base = currentRoute.split("?")[0] || "/";
      const next = safeNextPath(base);
      navigate(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (!isAdminUser(user)) {
      if (!warnedRef.current) {
        warnedRef.current = true;
        message.warning("Доступ в админ-панель разрешён только администратору.");
      }
      navigate("/cabinet");
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated) return null;
  if (!isAdminUser(user)) return null;
  return <>{children}</>;
}

