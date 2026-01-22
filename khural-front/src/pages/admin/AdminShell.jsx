import React from "react";
import { Button } from "antd";
import { readAdminAvatar } from "./adminAvatar.js";

const BRAND_LOGO_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg";

const NAV = [
  { key: "dashboard", label: "Панель управления", href: "/admin" },
  { key: "convocations", label: "Созывы", href: "/admin/convocations" },
  { key: "convocations-documents", label: "Документы созывов", href: "/admin/convocations/documents" },
  { key: "committees", label: "Комитеты", href: "/admin/committees" },
  { key: "deputies", label: "Депутаты", href: "/admin/deputies" },
  { key: "pages", label: "Страницы", href: "/admin/pages" },
  { key: "documents", label: "Документы", href: "/admin/documents" },
  { key: "slider", label: "Слайдер", href: "/admin/slider" },
  { key: "events", label: "События", href: "/admin/events" },
  { key: "news", label: "Новости", href: "/admin/news" },
  { key: "broadcast", label: "Трансляция", href: "/admin/broadcast" },
  { key: "appeals", label: "Обращения", href: "/admin/appeals" },
  { key: "env", label: "ENV доки", href: "/admin/env" },
];

function NavItem({ href, label, active, onClick }) {
  return (
    <a href={href} className={"admin-nav__item" + (active ? " is-active" : "")} onClick={onClick}>
      <span className="admin-nav__label">{label}</span>
    </a>
  );
}

export default function AdminShell({
  activeKey,
  title,
  user,
  themeMode,
  onToggleTheme,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(() => readAdminAvatar());

  React.useEffect(() => {
    const onAvatar = () => setAvatarUrl(readAdminAvatar());
    window.addEventListener("khural:admin-avatar-updated", onAvatar);
    return () => window.removeEventListener("khural:admin-avatar-updated", onAvatar);
  }, []);

  const avatarLetter = React.useMemo(() => {
    const s = String(user?.name || user?.email || "A").trim();
    return s ? s[0].toUpperCase() : "A";
  }, [user]);

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
            <img src={BRAND_LOGO_SRC} alt="" className="admin-emblem" />
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
          <a
            className="admin-user admin-user--link"
            href="/admin/profile"
            onClick={() => setSidebarOpen(false)}
          >
            <div className={"admin-user__avatar" + (avatarUrl ? " admin-user__avatar--img" : "")}>
              {avatarUrl ? <img src={avatarUrl} alt="" className="admin-user__avatarImg" /> : avatarLetter}
            </div>
            <div className="admin-user__meta">
              <div className="admin-user__name">{user?.name || user?.email || "Администратор"}</div>
              <div className="admin-user__role">{user?.role || "admin"}</div>
            </div>
          </a>

          <Button danger block onClick={onLogout} className="admin-logout-btn">
            Выйти
          </Button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <a className="admin-topbar__logo" href="/" aria-label="На главную">
              <img src={BRAND_LOGO_SRC} alt="" className="admin-emblem" />
            </a>
            <div className="admin-heading">
              <div className="admin-heading__title">{title}</div>
              {/* Intentionally hidden: subtitle line near the logo breaks header layout */}
            </div>
          </div>

          <div className="admin-topbar__right">
            <a
              href="/"
              className="admin-pillbtn admin-pillbtn--site"
              style={{ textDecoration: "none" }}
            >
              На сайт
            </a>
            <button
              className="admin-pillbtn admin-pillbtn--theme"
              type="button"
              onClick={onToggleTheme}
              aria-label={themeMode === "light" ? "Включить тёмную тему" : "Включить светлую тему"}
              title={themeMode === "light" ? "Тёмная тема" : "Светлая тема"}
            >
              <span style={{ fontSize: 18, lineHeight: 1, display: "inline-block", transform: "translateY(1px)" }}>
                {themeMode === "light" ? "☾" : "☀"}
              </span>
            </button>
            <button
              className="admin-iconbtn admin-iconbtn--menu"
              type="button"
              aria-label="Меню"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="admin-burger" />
            </button>
          </div>
        </header>

        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
