import React from "react";
import { App, Spin } from "antd";
import { useAuth } from "../context/AuthContext.jsx";
import { useHashRoute } from "../Router.jsx";

function safeNextPath(next) {
  const n = String(next || "");
  if (!n.startsWith("/")) return "/";
  if (n.startsWith("//")) return "/";
  return n;
}

function isAdminUser(u) {
  if (!u) return false;
  if (u.admin || u.isAdmin || u.admin_access || u.role?.admin_access) return true;
  const raw = u.role ?? u.role_id ?? u.roleId ?? "";
  const role = String(typeof raw === "object" ? raw?.name || raw?.id || raw?.role || "" : raw)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  return ["admin", "administrator", "админ", "администратор", "superadmin", "суперадмин", "root"].includes(role);
}

export default function RequireAdmin({ children }) {
  const { message } = App.useApp();
  const { isAuthenticated, user, authLoading } = useAuth();
  const { navigate } = useHashRoute();
  const warnedRef = React.useRef(false);

  React.useEffect(() => {
    // Профиль ещё загружается после F5 — не принимаем решение по роли,
    // иначе админ попадает в /cabinet/account до окончания hydrating.
    if (authLoading) return;

    if (!isAuthenticated) {
      const hash = typeof window !== "undefined" ? String(window.location.hash || "") : "";
      const currentRoute =
        typeof window !== "undefined"
          ? hash.startsWith("#/")
            ? hash.slice(1)
            : window.location.pathname + window.location.search + hash
          : "/";
      const base = currentRoute.split("?")[0] || "/";
      navigate(`/login?next=${encodeURIComponent(safeNextPath(base))}`);
      return;
    }

    if (!isAdminUser(user)) {
      if (!warnedRef.current) {
        warnedRef.current = true;
        message.warning("Доступ в админ-панель разрешён только администратору.");
      }
      navigate("/cabinet/account");
    }
  }, [isAuthenticated, user, authLoading, navigate, message]);

  if (authLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 240 }}>
        <Spin size="large" />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  if (!isAdminUser(user)) return null;
  return <>{children}</>;
}
