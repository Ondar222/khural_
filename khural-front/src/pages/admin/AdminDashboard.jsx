import React from "react";
import { Button } from "antd";

function StatCard({ label, value }) {
  return (
    <div className="admin-card admin-stat admin-card--hover">
      <div className="admin-stat__value">{value}</div>
      <div className="admin-stat__label">{label}</div>
    </div>
  );
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

export default function AdminDashboard({ stats }) {
  return (
    <div className="admin-grid admin-dashboard">
      <div className="admin-cards admin-cards--stats">
        <StatCard label="Депутаты" value={stats.deputies} />
        <StatCard label="Страницы" value={stats.pages || 0} />
        <StatCard label="Документы" value={stats.documents} />
        <StatCard label="Слайдер" value={stats.slides || 0} />
        <StatCard label="Новости" value={stats.news} />
        <StatCard label="События" value={stats.events || 0} />
        <StatCard label="Обращения" value={stats.appeals || 0} />
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
        <QuickAction
          title="Обращения граждан"
          description="Просмотр и обработка обращений"
          href="/admin/appeals"
        />
      </div>

    
    </div>
  );
}



