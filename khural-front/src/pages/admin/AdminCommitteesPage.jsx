import React from "react";
import { Button, Input } from "antd";
import AdminShell from "./AdminShell.jsx";
import AdminCommitteesList from "./AdminCommitteesList.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";

export default function AdminCommitteesPage() {
  const adminData = useAdminData();
  const [selectedConvocationId, setSelectedConvocationId] = React.useState("all");
  const handleToggleActive = React.useCallback(
    (row, nextActive) => {
      if (!row || !adminData.updateCommittee) return;
      adminData.updateCommittee(row.id, { isActive: nextActive });
    },
    [adminData]
  );

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
      activeKey="committees"
      title="Комитеты"
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminCommitteesList
        items={adminData.committees}
        convocations={adminData.convocations}
        selectedConvocationId={selectedConvocationId}
        onConvocationChange={setSelectedConvocationId}
        onToggleActive={handleToggleActive}
        onReload={adminData.reload}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}

