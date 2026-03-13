import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function YouthParliamentRules() {
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
    ? "Регламент" 
    : lang === "ru" 
      ? "Регламент Молодежного Хурала" 
      : "Rules of the Youth Parliament";

  const description = lang === "ty" 
    ? "Аныяктар Хуралының Регламентизи үрүндүр салдынган." 
    : lang === "ru" 
      ? "Регламент Молодежного Хурала будет размещен в ближайшее время." 
      : "Rules of the Youth Parliament will be posted soon.";

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
              <p style={{ lineHeight: 1.8 }}>{description}</p>
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
