import React from "react";
import { Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useI18n } from "../../context/I18nContext.jsx";

function StatCard({ label, value, href }) {
  const content = (
    <>
      <div className="admin-stat__value">{value}</div>
      <div className="admin-stat__label">{label}</div>
    </>
  );
  if (href) {
    return (
      <a className="admin-card admin-stat admin-card--hover admin-stat--link" href={href}>
        {content}
      </a>
    );
  }
  return <div className="admin-card admin-stat admin-card--hover">{content}</div>;
}

function QuickAction({ title, description, href }) {
  const { t } = useI18n();
  return (
    <a className="admin-card admin-action admin-card--hover" href={href}>
      <div className="admin-action__title">{title}</div>
      <div className="admin-action__desc">{description}</div>
      <div className="admin-action__cta">{t("adminDashboardGo")}</div>
    </a>
  );
}

export default function AdminDashboard({
  stats,
  statsReady,
  adminPagesCount,
  adminPagesLoading,
  broadcastsCount,
  broadcastsLoading,
  onReload,
  onReloadSuccess,
}) {
  const { lang, t } = useI18n();
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const handleRefresh = React.useCallback(async () => {
    if (!onReload) return;
    setRefreshing(true);
    try {
      await onReload();
      setLastUpdated(new Date());
      onReloadSuccess?.();
    } finally {
      setRefreshing(false);
    }
  }, [onReload, onReloadSuccess]);

  return (
    <div className="admin-grid admin-dashboard">
      {onReload && (
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          {lastUpdated && (
            <span style={{ fontSize: 13, color: "#6b7280" }}>
              {t("adminDashboardUpdated")}: {lastUpdated.toLocaleTimeString(lang === "ty" ? "tyv-RU" : "ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            size="middle"
          >
            {t("adminDashboardRefreshStats")}
          </Button>
        </div>
      )}
      <p style={{ gridColumn: "1 / -1", margin: "0 0 8px", color: "#6b7280", fontSize: 13 }}>
        {t("adminDashboardStatsHint")}
      </p>
      <div className="admin-cards admin-cards--stats">
        <StatCard label={t("adminDashboardConvocations")} value={statsReady ? stats.convocations ?? 0 : "—"} href="/admin/convocations" />
        <StatCard label={t("adminDashboardCommittees")} value={statsReady ? stats.committees ?? 0 : "—"} href="/admin/committees" />
        <StatCard label={t("adminDashboardCommissions")} value={statsReady ? stats.commissions ?? 0 : "—"} href="/admin/commissions" />
        <StatCard label={t("adminDashboardDeputies")} value={statsReady ? stats.deputies ?? 0 : "—"} href="/admin/deputies" />
        <StatCard
          label={t("adminDashboardPages")}
          value={adminPagesLoading ? "—" : adminPagesCount ?? "—"}
          href="/admin/pages"
        />
        {/* <StatCard label="Документы" value={stats.documents ?? 0} href="/admin/documents" /> */}
        <StatCard label={t("adminDashboardSlider")} value={statsReady ? stats.slides ?? 0 : "—"} href="/admin/slider" />
        <StatCard label={t("adminDashboardNews")} value={statsReady ? stats.news ?? 0 : "—"} href="/admin/news" />
        <StatCard label={t("adminDashboardEvents")} value={statsReady ? stats.events ?? 0 : "—"} href="/admin/events" />
        {/* <StatCard label="Обращения" value={stats.appeals ?? 0} href="/admin/appeals" /> */}
        <StatCard
          label={t("adminDashboardBroadcasts")}
          value={broadcastsLoading ? "—" : broadcastsCount}
          href="/admin/broadcast"
        />
        {/* <StatCard label="ENV доки" value={"—"} href="/admin/env" /> */}
      </div>

      <div className="admin-cards admin-cards--actions">
        <QuickAction
          title={t("adminDashboardAddNews")}
          description={t("adminDashboardAddNewsDesc")}
          href="/admin/news"
        />
        <QuickAction
          title={t("adminDashboardAddDeputy")}
          description={t("adminDashboardAddDeputyDesc")}
          href="/admin/deputies"
        />
        <QuickAction
          title={t("adminDashboardManagePages")}
          description={t("adminDashboardManagePagesDesc")}
          href="/admin/pages"
        />
        {/* <QuickAction
          title="Загрузить документ"
          description="Законы, постановления, инициативы и т.д."
          href="/admin/documents"
        /> */}
        <QuickAction
          title={t("adminDashboardAddEvent")}
          description={t("adminDashboardAddEventDesc")}
          href="/admin/events"
        />
        <QuickAction
          title={t("adminDashboardSliderAnnouncement")}
          description={t("adminDashboardSliderAnnouncementDesc")}
          href="/admin/slider"
        />
        {/* <QuickAction title="Обращения граждан" description="Просмотр и обработка обращений" href="/admin/appeals" /> */}
      </div>

    
    </div>
  );
}
