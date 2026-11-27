import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { openCookieSettings } from "../utils/cookieConsent.js";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined, PrinterOutlined } from "@ant-design/icons";
import { useSiteChrome } from "../hooks/useSiteChrome.js";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

const DEFAULT_SOCIALS = [
  {
    id: "vk",
    titleRu: "ВКонтакте",
    titleTyv: "ВКонтакте",
    url: "https://vk.com/public114457376",
    isVisible: true,
  },
  {
    id: "max",
    titleRu: "Макс",
    titleTyv: "Макс",
    url: "https://max.ru/khuraltyva/AZ-yY-ezegk",
    isVisible: true,
  },
];

const DEFAULT_CONTACTS = [
  {
    id: "address",
    labelRu: "Адрес:",
    labelTyv: "АДРЕС:",
    valueRu: "667000, г. Кызыл, ул. Ленина, д. 32",
    valueTyv: "667000, Кызыл хоорай, Ленина кудумчузу, 32 дугаар бажың.",
    icon: "address",
    isVisible: true,
  },
  {
    id: "phone",
    labelRu: "Канцелярия:",
    labelTyv: "КАНЦЕЛЯРИЯ:",
    valueRu: "+7 (39422) 2-10-43",
    valueTyv: "+7 (39422) 2-10-43",
    href: "tel:+73942221043",
    icon: "phone",
    isVisible: true,
  },
  {
    id: "receiption",
    labelRu: "Приемная:",
    labelTyv: "ПРИЕМНАЯ:",
    valueRu: "+7 (39422) 2-16-32",
    valueTyv: "+7 (39422) 2-16-32",
    icon: "printer",
    isVisible: true,
  },
  {
    id: "email",
    labelRu: "E-mail:",
    labelTyv: "E-mail:",
    valueRu: "khural@inbox.ru",
    valueTyv: "khural@inbox.ru",
    href: "mailto:khural@inbox.ru",
    icon: "email",
    isVisible: true,
  },
];

export default function Footer() {
  const { lang, t } = useI18n();
  const { footer, footerGroups, footerItems } = useSiteChrome();
  const phoneIconStyle = { transform: "scaleX(-1)" };
  const isTy = lang === "ty";

  // Для тувинского языка - три строки (используются, если название не задано в настройках)
  const tyBrandLines = isTy
    ? ["Тыва Республиканын", "Дээди Хуралы", "(ПАРЛАМЕНТИЗИ)"]
    : null;
  const brandLine1 = !isTy ? "Верховный Хурал" : t("brandTop");
  const brandLine2 = !isTy ? "(парламент)" : t("brandParliament");
  const brandLine3 = !isTy ? "Республики Тыва" : t("brandBottom");

  const localized = (ru, tyv) => (isTy ? tyv || ru : ru || tyv);

  const orgName = localized(footer?.organizationNameRu, footer?.organizationNameTyv);
  const copyrightText = localized(footer?.copyrightTextRu, footer?.copyrightTextTyv);
  const developerText = localized(footer?.developerTextRu, footer?.developerTextTyv);
  const copyrightYear = footer?.copyrightYear || new Date().getFullYear();

  const hasMenuGroupSelection = Array.isArray(footer?.menuGroupIds);
  const selectedGroupIds = hasMenuGroupSelection
    ? new Set(footer.menuGroupIds.map(String))
    : null;
  const groups = (footerGroups || []).filter(
    (group) => !selectedGroupIds || selectedGroupIds.has(String(group.id)),
  );

  const itemsByGroup = React.useMemo(() => {
    const map = new Map();
    const walk = (items, inheritedGroupId) => {
      (items || []).forEach((item) => {
        if (!item || item.isVisible === false) return;
        const groupId = item.groupId ?? inheritedGroupId;
        const key = String(groupId ?? "ungrouped");
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
        if (Array.isArray(item.children)) walk(item.children, groupId);
      });
    };
    walk(footerItems, null);
    return map;
  }, [footerItems]);

  // Пустой массив из API — осознанный выбор сотрудника (все соцсети/контакты
  // удалены). Захардкоженные списки используем только если данных нет вообще.
  const socials = Array.isArray(footer?.socials)
    ? footer.socials.filter((item) => item.isVisible !== false)
    : DEFAULT_SOCIALS;
  const contacts = Array.isArray(footer?.contacts)
    ? footer.contacts.filter((item) => item.isVisible !== false)
    : DEFAULT_CONTACTS;

  const socialIconLabels = {
    vk: "VK",
    max: "M",
    telegram: "TG",
    ok: "OK",
    youtube: "YT",
    rutube: "RT",
  };

  const iconByType = {
    address: EnvironmentOutlined,
    phone: PhoneOutlined,
    printer: PrinterOutlined,
    email: MailOutlined,
  };

  const renderMenuColumn = (group, fallback) => (
    <div className="footer-col" key={group?.id || fallback.title}>
      <h4>{group ? group.title : t(fallback.titleKey || fallback.title)}</h4>
      <nav>
        {(group ? itemsByGroup.get(String(group.id)) || [] : fallback.links).map((link, index) => {
          const href = link.href || link.url || "/";
          if (href === "#cookie-settings") {
            return (
              <a
                key={`${href}-${index}`}
                href="#cookie-settings"
                onClick={(event) => {
                  event.preventDefault();
                  openCookieSettings();
                }}
              >
                {link.label || link.title || t("Настройки cookie")}
              </a>
            );
          }
          return (
            <a key={`${href}-${index}`} href={href}>
              {link.label || link.title}
            </a>
          );
        })}
      </nav>
    </div>
  );

  const fallbackColumns = [
    {
      title: "region",
      links: [
        { href: "/government", label: t("government") },
        { href: "/appeals", label: t("feedback") },
        { href: "/sitemap", label: t("sitemap") },
      ],
    },
    {
      title: "news",
      links: [
        { href: "/news", label: t("hotNews") },
        { href: "/news", label: t("allNews") },
      ],
    },
    {
      title: "docs",
      links: [
        { href: "/pd-policy", label: t("pdPolicy") },
        { href: "#cookie-settings", label: t("Настройки cookie") },
        { href: "/license", label: t("license") },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand and Copyright Section */}
          <div className="footer-brand">
            <div className="brand" style={{ color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="logo" style={{ borderColor: "#fff", color: "#fff", flexShrink: 0 }}>
                <img
                  src={normalizeFilesUrl(footer?.logoUrl) || "https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"}
                  alt=""
                  width={56}
                  height={56}
                  style={{ display: "block" }}
                />
              </div>
              <div style={{ minWidth: 0, overflowWrap: "break-word", display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.1 }}>
                {orgName ? (
                  <div style={{ fontSize: 15, lineHeight: 1.2, fontWeight: 800, color: "#fff" }}>{orgName}</div>
                ) : tyBrandLines ? (
                  <>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>{tyBrandLines[0]}</div>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>{tyBrandLines[1]}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.1, color: "#fff", opacity: 0.9 }}>{tyBrandLines[2]}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 900, color: "#fff", opacity: 0.9 }}>{brandLine1}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.1, color: "#fff", opacity: 0.9 }}>{brandLine2}</div>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>{brandLine3}</div>
                  </>
                )}
              </div>
            </div>
            <div className="footer-copyright">
              {footer?.showCopyright !== false && (
                <p>
                  {copyrightText
                    ? `${copyrightYear} ${copyrightText}`
                    : `${copyrightYear} © ${t("© 2026 ВЕРХОВНЫЙ ХУРАЛ (ПАРЛАМЕНТ) РТ").replace(/^©\s*\d{4}\s*/, "")}`}
                </p>
              )}
              {footer?.showCopyright !== false && !copyrightText && <p>{t("ВСЕ ПРАВА ЗАЩИЩЕНЫ.")}</p>}
              {footer?.showDeveloper !== false && (
                <p className="footer-dev">
                  {footer?.developerUrl ? (
                    <a href={footer.developerUrl} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>
                      {developerText || t("Разработано Lana Soft")}
                    </a>
                  ) : (
                    developerText || t("Разработано Lana Soft")
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-links">
            {groups.length
              ? groups.map((group) => renderMenuColumn(group))
              : hasMenuGroupSelection
                ? null
                : fallbackColumns.map((column) => renderMenuColumn(null, column))}
            {footer?.showSocials !== false && socials.length > 0 && (
              <div className="footer-col">
                <h4>{t("socials")}</h4>
                <nav>
                  {socials.map((social) => (
                    <a
                      key={social.id || social.url}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      {/* {socialIconLabels[social.icon] ? (
                        <span
                          aria-hidden="true"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 26,
                            height: 22,
                            padding: "0 4px",
                            borderRadius: 4,
                            background: "rgba(255,255,255,0.12)",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                          }}
                        >
                          {socialIconLabels[social.icon]}
                        </span>
                      ) : null} */}
                      <span>{localized(social.titleRu, social.titleTyv)}</span>
                    </a>
                  ))}
                </nav>
              </div>
            )}
          </div>

          {/* Contact Information */}
          {(footer?.showContacts !== false || !footer) && contacts.length > 0 && (
            <div className="footer-contacts">
              <h4>{t("Контакты")}</h4>
              {contacts.map((contact, index) => {
                const Icon = iconByType[contact.icon] || EnvironmentOutlined;
                const value = localized(contact.valueRu, contact.valueTyv);
                return (
                  <div className="contact-item" key={contact.id || index}>
                    <Icon
                      className="contact-icon"
                      style={contact.icon === "phone" ? phoneIconStyle : undefined}
                      aria-hidden="true"
                    />
                    <div className="contact-text">
                      <strong>{localized(contact.labelRu, contact.labelTyv)}</strong>{" "}
                      {contact.href ? <a href={contact.href}>{value}</a> : <span>{value}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
