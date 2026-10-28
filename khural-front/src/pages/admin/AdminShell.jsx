import React from "react";
import { Button } from "antd";
import { readAdminAvatar } from "./adminAvatar.js";
import { MoonIcon, SunIcon } from "../../components/icons/LinearIcons.jsx";
import { useI18n } from "../../context/I18nContext.jsx";

const BRAND_LOGO_SRC =
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg";

const NAV = [
  { key: "dashboard", labelKey: "adminNavDashboard", label: "Панель управления", href: "/admin" },
  { key: "convocations", labelKey: "adminNavConvocations", label: "Созывы", href: "/admin/convocations" },
  { key: "convocations-documents", labelKey: "adminNavConvocationsDocuments", label: "Документы созывов", href: "/admin/convocations/documents" },
  { key: "committees", labelKey: "adminNavCommittees", label: "Комитеты", href: "/admin/committees" },
  { key: "committee-reports", labelKey: "adminNavCommitteeReports", label: "Отчеты комитетов", href: "/admin/committee-reports" },
  { key: "commissions", labelKey: "adminNavCommissions", label: "Комиссии", href: "/admin/commissions" },
  { key: "deputies", labelKey: "adminNavDeputies", label: "Депутаты", href: "/admin/deputies" },
  { key: "portals", labelKey: "adminNavPortals", label: "Порталы", href: "/admin/portals" },
  { key: "pages", labelKey: "adminNavPages", label: "Страницы", href: "/admin/pages" },
  { key: "documents", labelKey: "adminNavDocuments", label: "Документы", href: "/admin/documents" },
  { key: "slider", labelKey: "adminNavSlider", label: "Слайдер", href: "/admin/slider" },
  { key: "events", labelKey: "adminNavEvents", label: "События", href: "/admin/events" },
  { key: "news", labelKey: "adminNavNews", label: "Новости", href: "/admin/news" },
  { key: "broadcast", labelKey: "adminNavBroadcast", label: "Трансляция", href: "/admin/broadcast" },
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
  const { lang, setLang, t } = useI18n();
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
            aria-label={t("adminCloseMenu")}
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
            <div className="admin-brand__title">{t("adminPanel")}</div>
            <div className="admin-brand__subtitle">khural</div>
          </div>
        </div>

        <nav className="admin-nav">
          {NAV.map((x) => (
            <NavItem
              key={x.key}
              href={x.href}
              label={t(x.labelKey)}
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
              <div className="admin-user__name">{user?.name || user?.email || t("adminAdministrator")}</div>
              <div className="admin-user__role">{user?.role || "admin"}</div>
            </div>
          </a>

          <Button danger block onClick={onLogout} className="admin-logout-btn">
            {t("adminLogout")}
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
            <button
              className="admin-pillbtn admin-pillbtn--lang"
              type="button"
              onClick={() => setLang(lang === "ru" ? "ty" : "ru")}
              aria-label={t("adminSwitchLang")}
              title={t("adminSwitchLang")}
            >
              {lang === "ru" ? "ТЫ" : "РУ"}
            </button>
            <a
              href="/"
              className="admin-pillbtn admin-pillbtn--site"
              style={{ textDecoration: "none" }}
            >
              {t("adminGoToSite")}
            </a>
            <button
              className="admin-pillbtn admin-pillbtn--theme"
              type="button"
              onClick={onToggleTheme}
              aria-label={themeMode === "light" ? t("adminDarkTheme") : t("adminLightTheme")}
              title={themeMode === "light" ? t("adminDarkTheme") : t("adminLightTheme")}
            >
              <span style={{ fontSize: 18, lineHeight: 1, display: "inline-block", transform: "translateY(1px)" }}>
                {themeMode === "light" ? <MoonIcon size={15} /> : <SunIcon size={15} />}
              </span>
            </button>
            <button
              className="admin-iconbtn admin-iconbtn--menu"
              type="button"
              aria-label={t("adminMenu")}
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
