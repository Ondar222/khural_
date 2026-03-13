import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import { ArrowLeftOutlined, EnvironmentOutlined, PhoneOutlined, MailOutlined, LinkOutlined } from "@ant-design/icons";

export default function YouthParliamentContacts() {
  const { lang } = useI18n();

  const backText = lang === "ty" 
    ? "Эглири" 
    : lang === "ru" 
      ? "Назад" 
      : "Back";

  const buttonStyle = { 
    display: "inline-flex", 
    alignItems: "center", 
    gap: "6px",
    background: "#ffffff",
    border: "1px solid #d9d9d9",
    color: "#003366",
    padding: "6px 16px",
    borderRadius: "6px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
  };

  const title = lang === "ty" 
    ? "Харылзаа" 
    : lang === "ru" 
      ? "Контакты" 
      : "Contacts";

  const iconStyle = { fontSize: 18, color: "#003366", flexShrink: 0 };

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: "16px" }}>
              <a 
                href="/youth-parliament" 
                className="btn" 
                style={buttonStyle}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f5f5f5";
                  e.target.style.borderColor = "#bfbfbf";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ffffff";
                  e.target.style.borderColor = "#d9d9d9";
                }}
              >
                <ArrowLeftOutlined /> {backText}
              </a>
            </div>
            <h1>{title}</h1>

            <div className="card" style={{ padding: "24px", marginTop: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>
                {lang === "ty" 
                  ? "Аныяктар Хуралы (парламент)" 
                  : "Молодежный Хурал (парламент) Республики Тыва"}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <EnvironmentOutlined style={iconStyle} />
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "6px" }}>
                      {lang === "ty" ? "АДРЕС:" : "Адрес:"}
                    </span>
                    <span>
                      {lang === "ty" 
                        ? "Тыва Республика, Кызыл хоорай, Ленина кудумчузу, 32, 214 дугаар кабинет" 
                        : "Республика Тыва, г. Кызыл, Ленина 32, каб. 214"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <PhoneOutlined style={iconStyle} />
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "6px" }}>
                      {lang === "ty" ? "ТЕЛЕФОН:" : "Телефон:"}
                    </span>
                    <a href="tel:+73942223225" style={{ color: "#003366", textDecoration: "none" }}>
                      8 (39422) 2-32-25
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <MailOutlined style={iconStyle} />
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "6px" }}>
                      {lang === "ty" ? "E-MAIL:" : "E-mail:"}
                    </span>
                    <a href="mailto:molodezhnyjhural@mail.ru" style={{ color: "#003366", textDecoration: "none" }}>
                      molodezhnyjhural@mail.ru
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <LinkOutlined style={iconStyle} />
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "6px" }}>
                      {lang === "ty" ? "САЙТ:" : "Сайт:"}
                    </span>
                    <a href="http://мхрт.рф/" target="_blank" rel="noopener noreferrer" style={{ color: "#003366", textDecoration: "none" }}>
                      http://мхрт.рф/
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <svg style={iconStyle} viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4.5h2v-2h-2v2zm0-3h2V7h-2v5.5z"/>
                  </svg>
                  <div>
                    <span style={{ fontWeight: 600, marginRight: "6px" }}>
                      {lang === "ty" ? "БИЗ ВКонтакте:" : "Мы ВКонтакте:"}
                    </span>
                    <a href="https://vk.com/mol_parlament_rt" target="_blank" rel="noopener noreferrer" style={{ color: "#003366", textDecoration: "none" }}>
                      https://vk.com/mol_parlament_rt
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <SideNav
            title={lang === "ty" ? "Аныяктар Хуралы" : "Молодежный Хурал"}
            loadPages={true}
            autoSection={true}
          />
        </div>
      </div>
    </section>
  );
}
