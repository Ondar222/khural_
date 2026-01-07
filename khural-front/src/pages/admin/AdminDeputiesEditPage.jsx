import React from "react";
import { Button, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import AdminDeputyEditor from "./AdminDeputyEditor.jsx";

export default function AdminDeputiesEditPage() {
  const adminData = useAdminData();
  const { route } = useHashRoute();

  const deputyId = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    if (typeof window !== "undefined" && window.__routeParams && window.__routeParams.id) {
      return String(window.__routeParams.id);
    }
    const match = base.match(/\/admin\/deputies\/edit\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : "";
  }, [route]);

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>Вход в админку</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          Чтобы редактировать, добавлять и удалять записи, выполните вход.
        </div>
        <Input placeholder="Email" value={adminData.email} onChange={(e) => adminData.setEmail(e.target.value)} />
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

  if (!deputyId) {
    return (
      <AdminShell
        activeKey="deputies"
        title="Ошибка"
        subtitle=""
        user={adminData.user}
        themeMode={adminData.themeMode}
        onToggleTheme={adminData.toggleTheme}
        onLogout={adminData.handleLogout}
      >
        <div className="admin-card">Неверный ID депутата</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="deputies"
      title="Редактирование депутата"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminDeputyEditor mode="edit" deputyId={deputyId} canWrite={adminData.canWrite} />
    </AdminShell>
  );
}


