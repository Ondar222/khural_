import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import { DocumentIcon } from "../../components/icons/LinearIcons.jsx";

export default function YouthParliamentReports() {
  const { lang } = useI18n();

  const backText = lang === "ty" 
    ? "Эглири" 
    : lang === "ru" 
      ? "Назад" 
      : "Back";

  const reports = [
    {
      title: "Отчет Молодежного Хурала за 2015 год",
      href: "/youth-parliament/reports/2015",
    },
    {
      title: "Отчет Молодежного Хурала за 2016 год",
      href: "/youth-parliament/reports/2016",
    },
    {
      title: "Отчет Молодежного Хурала за 2017 год",
      href: "/youth-parliament/reports/2017",
    },
    {
      title: "Отчет Молодежного Хурала за 2018 год",
      href: "/youth-parliament/reports/2018",
    },
    {
      title: "Отчет Молодежного Хурала за 2020 год",
      href: "/youth-parliament/reports/2020",
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: "16px" }}>
              <a 
                href="/youth-parliament" 
                className="btn" 
                style={{ 
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
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#bfbfbf";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#d9d9d9";
                }}
              >
                ← {backText}
              </a>
            </div>

            <h1 className="youth-parliament__title h1-compact">
              {lang === "ty" ? "Аныяктар Хуралының Отчеттору" : "Отчеты Молодежного Хурала"}
            </h1>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
              {reports.map((report) => (
                <a
                  key={report.href}
                  href={report.href}
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
                      <DocumentIcon size={20} />
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, color: "#003366", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {lang === "ty" ? getTyvaTitle(report.title) : report.title}
                  </div>
                  <div style={{ color: "#0066cc", fontSize: 18, fontWeight: 600, flexShrink: 0 }}>→</div>
                </a>
              ))}
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

function getTyvaTitle(title) {
  const translations = {
    "Отчет Молодежного Хурала за 2015 год": "Аныяктар Хуралының 2015 чылда отчету",
    "Отчет Молодежного Хурала за 2016 год": "Аныяктар Хуралының 2016 чылда отчету",
    "Отчет Молодежного Хурала за 2017 год": "Аныяктар Хуралының 2017 чылда отчету",
    "Отчет Молодежного Хурала за 2018 год": "Аныяктар Хуралының 2018 чылда отчету",
    "Отчет Молодежного Хурала за 2020 год": "Аныяктар Хуралының 2020 чылда отчету",
  };
  return translations[title] || title;
}
