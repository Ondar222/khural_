import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import { ClipboardIcon } from "../components/icons/LinearIcons.jsx";

export default function YouthParliament() {
  const { lang } = useI18n();

  const links = [
    {
      title: "Положение Молодежного Хурала",
      href: "/youth-parliament/regulation",
    },
    {
      title: "Состав Молодежного Хурала",
      href: "/youth-parliament/composition",
    },
    {
      title: "Отчеты Молодежного Хурала",
      href: "/youth-parliament/reports",
    },
    {
      title: "Контакты",
      href: "/youth-parliament/contacts",
    },
    {
      title: "Повестки заседаний сессий Молодежного Хурала",
      href: "/youth-parliament/agendas",
    },
    {
      title: "Проект \"Дуза\"",
      href: "/youth-parliament/duza-project",
    },
    {
      title: "Регламент Молодежного Хурала",
      href: "/youth-parliament/rules",
    },
  ];

  const title =
    lang === "ty"
      ? "Тыва Республиканың Дээди Хуралының (парламентизиниң) чанында Тыва Республиканың Аныяктар Хуралы (парламент)"
      : "Молодежный Хурал (парламент) Республики Тыва при Верховном Хурале (парламенте) Республики Тыва";

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <h1 className="youth-parliament__title">{title}</h1>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "20px 24px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 51, 102, 0.1)";
                    e.currentTarget.style.borderColor = "#003366";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #003366 0%, #0055a5 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ display: "inline-flex", color: "#fff" }}>
                      <ClipboardIcon size={20} />
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: "#003366", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {lang === "ty" ? getTyvaTitle(link.title) : link.title}
                  </div>
                  <div style={{ color: "#0066cc", fontSize: 18, fontWeight: 600, flexShrink: 0 }}>→</div>
                </a>
              ))}
            </div>
          </div>
          <SideNav
            links={[
              { label: "Общие сведения", href: "/about" },
              { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
              { label: "Руководство", href: "/government" },
              { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
              { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
              { label: "Депутатские фракции", href: "/about?tab=structure&focus=factions" },
              { label: "Представительство в Совете Федерации", href: "/struct/council" },
              { label: "Молодежный Хурал", href: "/youth-parliament" },
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function getTyvaTitle(title) {
  const translations = {
    "Положение Молодежного Хурала": "Аныяктар Хуралының Дүрүмү",
    "Состав Молодежного Хурала": "Аныяктар Хуралының Тургузуу",
    "Отчеты Молодежного Хурала": "Аныяктар Хуралының Отчеттору",
    "Контакты": "Харылзаа",
    "Повестки заседаний сессий Молодежного Хурала": "Аныяктар Хуралының хуралдарының повесткалары",
    "Проект \"Дуза\"": "\"Дуза\" төлевилел",
    "Регламент Молодежного Хурала": "Аныяктар Хуралының Регламентизи",
  };
  return translations[title] || title;
}
