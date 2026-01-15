import React from "react";
import { App, Button, Input } from "antd";
import AdminShell from "./AdminShell.jsx";
import AdminConvocationsList from "./AdminConvocationsList.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminConvocationsPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();

  // Отладка: логируем данные созывов
  React.useEffect(() => {
    console.log("AdminConvocationsPage - convocations:", adminData.convocations);
    console.log("AdminConvocationsPage - convocations count:", Array.isArray(adminData.convocations) ? adminData.convocations.length : 0);
  }, [adminData.convocations]);

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

  return (
    <AdminShell
      activeKey="convocations"
      title="Созывы"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminConvocationsList
        items={adminData.convocations}
        onDelete={adminData.deleteConvocation}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

