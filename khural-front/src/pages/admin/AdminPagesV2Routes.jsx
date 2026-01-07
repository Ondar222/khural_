import React from "react";
import { App, Button, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import RequireAuth from "../../components/RequireAuth.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminPagesV2List from "./AdminPagesV2List.jsx";
import AdminPagesV2Create from "./AdminPagesV2Create.jsx";
import AdminPagesV2Edit from "./AdminPagesV2Edit.jsx";

export default function AdminPagesV2Routes() {
  const adminData = useAdminData();
  const { message } = App.useApp();
  const { navigate } = useHashRoute();

  const pathname =
    typeof window !== "undefined" ? window.location.pathname || "/admin/pages" : "/admin/pages";

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          Чтобы редактировать, добавлять и удалять записи, выполните вход.
        </div>
        <Input
          placeholder="Email"
          value={adminData.email}
          onChange={(e) => adminData.setEmail(e.target.value)}
        />
        <Input.Password
          placeholder="Пароль"
          value={adminData.password}
          onChange={(e) => adminData.setPassword(e.target.value)}
        />
        <Button type="primary" loading={adminData.loginBusy} onClick={adminData.handleLogin}>
          Войти
        </Button>
      </div>
    </div>
  ) : null;

  const content = (() => {
    if (pathname === "/admin/pages/create") {
      return (
        <AdminPagesV2Create
          canWrite={adminData.canWrite}
          onDone={() => navigate("/admin/pages")}
        />
      );
    }
    if (pathname.startsWith("/admin/pages/edit/")) {
      const id = pathname.slice("/admin/pages/edit/".length);
      return (
        <AdminPagesV2Edit
          id={id}
          canWrite={adminData.canWrite}
          onDone={() => navigate("/admin/pages")}
        />
      );
    }
    return (
      <AdminPagesV2List
        canWrite={adminData.canWrite}
        onCreate={() => navigate("/admin/pages/create")}
        onEdit={(id) => navigate(`/admin/pages/edit/${encodeURIComponent(id)}`)}
        onPreview={(slug) => window.open(`/p/${encodeURIComponent(slug)}`, "_blank")}
        onMessage={(type, text) => {
          if (type === "success") message.success(text);
          else message.error(text);
        }}
      />
    );
  })();

  return (
    <RequireAuth>
      <AdminShell
        activeKey="pages"
        title="Страницы"
        subtitle={`API: ${adminData.apiBase || "—"} • ${
          adminData.canWrite ? "доступ на запись" : "только просмотр"
        }`}
        user={adminData.user}
        themeMode={adminData.themeMode}
        onToggleTheme={adminData.toggleTheme}
        onLogout={adminData.handleLogout}
      >
        {loginCard}
        {content}
      </AdminShell>
    </RequireAuth>
  );
}


