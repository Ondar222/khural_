import React from "react";
import { Button } from "antd";

function StatCard({ label, value }) {
  return (
    <div className="admin-card admin-stat">
      <div className="admin-stat__value">{value}</div>
      <div className="admin-stat__label">{label}</div>
    </div>
  );
}

function QuickAction({ title, description, href }) {
  return (
    <a className="admin-card admin-action" href={href}>
      <div className="admin-action__title">{title}</div>
      <div className="admin-action__desc">{description}</div>
      <div className="admin-action__cta">Перейти</div>
    </a>
  );
}

export default function AdminDashboard({ stats }) {
  return (
    <div className="admin-grid">
      <div className="admin-cards admin-cards--stats">
        <StatCard label="Депутаты" value={stats.deputies} />
        <StatCard label="Страницы" value={stats.pages || 0} />
        <StatCard label="Документы" value={stats.documents} />
        <StatCard label="Новости" value={stats.news} />
        <StatCard label="События" value={stats.events || 0} />
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
      </div>

      <div className="admin-card admin-note">
        <div className="admin-note__title">Подсказка</div>
        <div className="admin-note__text">
          Если API недоступен, админка продолжит работать в режиме предпросмотра (данные будут
          только локально в браузере).
        </div>
        <Button href="/admin/news" type="primary">
          Начать
        </Button>
      </div>
    </div>
  );
}



