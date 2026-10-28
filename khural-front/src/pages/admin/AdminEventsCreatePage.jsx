import React from "react";
import { Button, Input } from "antd";
import AdminShell from "./AdminShell.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import AdminEventEditor from "./AdminEventEditor.jsx";
import { useI18n } from "../../context/I18nContext.jsx";

export default function AdminEventsCreatePage() {
  const adminData = useAdminData();
  const { t } = useI18n();

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{t("adminLoginTitle")}</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          {t("adminLoginHint")}
        </div>
        <Input placeholder={t("adminEmailPlaceholder")} value={adminData.email} onChange={(e) => adminData.setEmail(e.target.value)} />
        <Input.Password
          placeholder={t("adminPasswordPlaceholder")}
          value={adminData.password}
          onChange={(e) => adminData.setPassword(e.target.value)}
        />
        <Button type="primary" loading={adminData.loginBusy} onClick={adminData.handleLogin}>
          {t("adminLoginBtn")}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <AdminShell
      activeKey="events"
      title={t("adminEventCreatePageTitle")}
      subtitle={`API: ${adminData.apiBase || "—"} • ${adminData.canWrite ? "доступ на запись" : "только просмотр"}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminEventEditor
        mode="create"
        items={adminData.events}
        onCreate={adminData.createEvent}
        onUpdate={adminData.updateEvent}
        busy={adminData.busy}
        canWrite={adminData.canWrite}
      />
    </AdminShell>
  );
}


