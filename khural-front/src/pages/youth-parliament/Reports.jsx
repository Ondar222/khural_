import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import { FileTextOutlined, ArrowLeftOutlined } from "@ant-design/icons";

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
            <h1>Отчеты Молодежного Хурала</h1>

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
                {reports.map((report, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FileTextOutlined
                      style={{
                        marginRight: 10,
                        color: "#003366",
                        fontSize: 16,
                      }}
                    />
                    <a
                      href={report.href}
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
                        ? getTyvaTitle(report.title)
                        : report.title}
                    </a>
                  </li>
                ))}
              </ul>
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
