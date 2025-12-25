import React from "react";
import { App, Button, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import AdminShell from "./AdminShell.jsx";
import AdminNewsEdit from "./AdminNewsEdit.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminNewsEditPage() {
  const adminData = useAdminData();
  const { route } = useHashRoute();
  const { message } = App.useApp();

  // Извлекаем ID из маршрута или из параметров роутера
  const newsId = React.useMemo(() => {
    const base = (route || "/").split("?")[0];
    
    // First try to get from route params (if router supports it)
    if (typeof window !== "undefined" && window.__routeParams && window.__routeParams.id) {
      const id = parseInt(window.__routeParams.id, 10);
      if (!isNaN(id)) {
        return id;
      }
    }
    
    // Fallback: extract from URL
    const match = base.match(/\/admin\/news\/edit\/(\d+)$/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (!isNaN(id)) {
        return id;
      }
    }
    
    return null;
  }, [route]);

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

  if (!newsId) {
    return (
      <AdminShell
        activeKey="news"
        title="Ошибка"
        subtitle=""
        user={adminData.user}
        themeMode={adminData.themeMode}
        onToggleTheme={adminData.toggleTheme}
        onLogout={adminData.handleLogout}
      >
        <div className="admin-card">Неверный ID новости</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      activeKey="news"
      title="Редактирование новости"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminNewsEdit newsId={newsId} onUpdate={adminData.updateNews} busy={adminData.busy} canWrite={adminData.canWrite} />
    </AdminShell>
  );
}


