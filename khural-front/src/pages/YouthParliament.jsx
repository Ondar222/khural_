import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import SideNav from "../components/SideNav.jsx";
import { LinkOutlined } from "@ant-design/icons";

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
            <h1>{title}</h1>

            <div
              className="card"
              style={{
                marginTop: 24,
                padding: "24px",
              }}
            >
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {links.map((link, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <LinkOutlined
                      style={{
                        marginRight: 10,
                        color: "#003366",
                        fontSize: 16,
                      }}
                    />
                    <a
                      href={link.href}
                      style={{
                        color: "#003366",
                        textDecoration: "none",
                        fontSize: "clamp(14px, 2.5vw, 16px)",
                        fontWeight: 500,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.color = "#1890ff";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.color = "#003366";
                      }}
                    >
                      {lang === "ty"
                        ? getTyvaTitle(link.title)
                        : link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SideNav
            title={lang === "ty" ? "Аныяктар Хуралы" : "Молодежный Хурал"}
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
