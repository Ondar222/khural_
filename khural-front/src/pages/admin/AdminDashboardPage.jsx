import React from "react";
import { App, Button, Input } from "antd";
import AdminShell from "./AdminShell.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import { useAdminData } from "../../hooks/useAdminData.js";
import { useBroadcastLinks } from "../../hooks/useBroadcastLinks.js";
import { AboutApi } from "../../api/client.js";
import { countAdminPageRows } from "../../utils/adminPagesCatalog.js";
import { useI18n } from "../../context/I18nContext.jsx";

export default function AdminDashboardPage() {
  const adminData = useAdminData();
  const { t } = useI18n();
  const { items: broadcasts, loading: broadcastsLoading, reload: reloadBroadcasts } =
    useBroadcastLinks();
  const { message } = App.useApp();
  const [adminPagesCount, setAdminPagesCount] = React.useState(null);
  const [adminPagesLoading, setAdminPagesLoading] = React.useState(true);

  const reloadAdminPagesCount = React.useCallback(async () => {
    setAdminPagesLoading(true);
    try {
      const pages = adminData.isAuthenticated
        ? await AboutApi.listAdminPages()
        : await AboutApi.listPages();
      setAdminPagesCount(countAdminPageRows(pages));
    } catch (error) {
      setAdminPagesCount(null);
      message.error(
        `${t("adminDashboardPagesCountError")}: ${error?.message || "API"}`
      );
    } finally {
      setAdminPagesLoading(false);
    }
  }, [adminData.isAuthenticated, message, t]);

  React.useEffect(() => {
    reloadAdminPagesCount();
  }, [reloadAdminPagesCount]);

  const loginCard = !adminData.isAuthenticated ? (
    <div className="admin-card" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gap: 10, maxWidth: 520 }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>{t("adminLoginTitle")}</div>
        <div style={{ opacity: 0.8, fontSize: 13, lineHeight: 1.45 }}>
          {t("adminLoginHint")}
        </div>
        <Input
          placeholder={t("adminEmailPlaceholder")}
          value={adminData.email}
          onChange={(e) => adminData.setEmail(e.target.value)}
        />
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
      activeKey="dashboard"
      title={t("adminNavDashboard")}
      subtitle={`${t("adminApiLabel")}: ${adminData.apiBase || "—"}${adminData.canWrite ? t("adminWriteAllowed") : t("adminViewOnly")}`}
      user={adminData.user}
      themeMode={adminData.themeMode}
      onToggleTheme={adminData.toggleTheme}
      onLogout={adminData.handleLogout}
    >
      {loginCard}
      <AdminDashboard
        stats={adminData.stats}
        statsReady={adminData.statsReady}
        onReload={async () => {
          await Promise.all([adminData.reload(), reloadBroadcasts(), reloadAdminPagesCount()]);
        }}
        adminPagesCount={adminPagesCount}
        adminPagesLoading={adminPagesLoading}
        broadcastsCount={broadcasts.length}
        broadcastsLoading={broadcastsLoading}
        onReloadSuccess={() => message.success(t("adminDashboardRefreshDone"))}
      />
    </AdminShell>
  );
}
