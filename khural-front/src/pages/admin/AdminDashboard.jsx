import React from "react";
import { Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

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
  return (
    <a className="admin-card admin-action admin-card--hover" href={href}>
      <div className="admin-action__title">{title}</div>
      <div className="admin-action__desc">{description}</div>
      <div className="admin-action__cta">Перейти</div>
    </a>
  );
}

export default function AdminDashboard({ stats, onReload }) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(async () => {
    if (!onReload) return;
    setRefreshing(true);
    try {
      await onReload();
    } finally {
      setRefreshing(false);
    }
  }, [onReload]);

  return (
    <div className="admin-grid admin-dashboard">
      {onReload && (
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
            size="middle"
          >
            Обновить цифры
          </Button>
        </div>
      )}
      <div className="admin-cards admin-cards--stats">
        <StatCard label="Созывы" value={stats.convocations ?? 0} href="/admin/convocations" />
        <StatCard label="Комитеты" value={stats.committees ?? 0} href="/admin/committees" />
        <StatCard label="Депутаты" value={stats.deputies ?? 0} href="/admin/deputies" />
        <StatCard label="Страницы" value={stats.pages ?? 0} href="/admin/pages" />
        <StatCard label="Документы" value={stats.documents ?? 0} href="/admin/documents" />
        <StatCard label="Слайдер" value={stats.slides ?? 0} href="/admin/slider" />
        <StatCard label="Новости" value={stats.news ?? 0} href="/admin/news" />
        <StatCard label="События" value={stats.events ?? 0} href="/admin/events" />
        {/* <StatCard label="Обращения" value={stats.appeals ?? 0} href="/admin/appeals" /> */}
        <StatCard label="Трансляция" value={"—"} href="/admin/broadcast" />
        <StatCard label="ENV доки" value={"—"} href="/admin/env" />
      </div>

      <div className="admin-cards admin-cards--actions">
        <QuickAction
          title="Добавить новость"
          description="Создайте новость и загрузите обложку"
          href="/admin/news"
        />
        <QuickAction
          title="Добавить депутата"
          description="Создайте карточку депутата и загрузите фото"
          href="/admin/deputies"
        />
        <QuickAction
          title="Управление страницами"
          description="Создавайте и редактируйте контентные страницы"
          href="/admin/pages"
        />
        <QuickAction
          title="Загрузить документ"
          description="Законы, постановления, инициативы и т.д."
          href="/admin/documents"
        />
        <QuickAction
          title="Добавить событие"
          description="Событие появится в календаре на сайте"
          href="/admin/events"
        />
        <QuickAction
          title="Слайдер: важное объявление"
          description="Добавьте слайд для важных анонсов на главной"
          href="/admin/slider"
        />
        {/* <QuickAction title="Обращения граждан" description="Просмотр и обработка обращений" href="/admin/appeals" /> */}
      </div>

    
    </div>
  );
}



