import React from "react";
import { Button } from "antd";

const BRAND_LOGO_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg";

const NAV = [
  { key: "dashboard", label: "Панель управления", href: "#/admin" },
  { key: "deputies", label: "Депутаты", href: "#/admin/deputies" },
  { key: "documents", label: "Документы", href: "#/admin/documents" },
  { key: "events", label: "События", href: "#/admin/events" },
  { key: "news", label: "Новости", href: "#/admin/news" },
];

function NavItem({ href, label, active, onClick }) {
  return (
    <a
      href={href}
      className={"admin-nav__item" + (active ? " is-active" : "")}
      onClick={onClick}
    >
      <span className="admin-nav__label">{label}</span>
    </a>
  );
}

export default function AdminShell({
  activeKey,
  title,
  subtitle,
  user,
  themeMode,
  onToggleTheme,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="admin-shell">
      <div
        className={"admin-sidebar-backdrop" + (sidebarOpen ? " open" : "")}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={"admin-sidebar admin-sidebar--right" + (sidebarOpen ? " open" : "")}>
        <div className="admin-sidebar__top">
          <button
            className="admin-iconbtn admin-iconbtn--close"
            type="button"
            aria-label="Закрыть меню"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        <div className="admin-brand">
          <div className="admin-brand__logo">
            <img src={BRAND_LOGO_SRC} alt="" width={34} height={34} />
          </div>
          <div className="admin-brand__text">
            <div className="admin-brand__title">Админ-панель</div>
            <div className="admin-brand__subtitle">khural</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map((x) => (
            <NavItem
              key={x.key}
              href={x.href}
              label={x.label}
              active={x.key === activeKey}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <div className="admin-user__avatar">A</div>
            <div className="admin-user__meta">
              <div className="admin-user__name">
                {user?.name || user?.email || "Администратор"}
              </div>
              <div className="admin-user__role">{user?.role || "admin"}</div>
            </div>
          </div>

          <Button danger block onClick={onLogout}>
            Выйти
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <a className="admin-topbar__logo" href="/" aria-label="На главную">
              <img src={BRAND_LOGO_SRC} alt="" width={36} height={36} />
            </a>
            <div className="admin-heading">
              <div className="admin-heading__title">{title}</div>
              {subtitle ? (
                <div className="admin-heading__subtitle">{subtitle}</div>
              ) : null}
            </div>
          </div>

          <div className="admin-topbar__right">
            <button
              className="admin-iconbtn admin-iconbtn--menu"
              type="button"
              aria-label="Меню"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="admin-burger" />
            </button>
            <button
              className="admin-pillbtn"
              type="button"
              onClick={onToggleTheme}
            >
              {themeMode === "light" ? "Тёмная" : "Светлая"}
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

