import React from "react";
import { App } from "antd";
import AdminShell from "./AdminShell.jsx";
import AdminBroadcast from "./AdminBroadcast.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminBroadcastPage() {
  const adminData = useAdminData();
  const { message } = App.useApp();

  return (
    <AdminShell
      activeKey="broadcast"
      title="Трансляция"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      <AdminBroadcast />
    </AdminShell>
  );
}

