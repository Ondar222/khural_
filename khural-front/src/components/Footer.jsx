import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { EnvironmentOutlined, MailOutlined, PhoneOutlined, PrinterOutlined } from "@ant-design/icons";

export default function Footer() {
  const { lang, t } = useI18n();
  const phoneIconStyle = { transform: "scaleX(-1)" };
  // Для тувинского языка - три строки с "(Парламентизи)" по середине
  const tyBrandLines = lang === "ty" 
    ? ["Тыва Республиканын", "(Парламентизи)", "Дээди Хуралы"] 
    : null;
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand and Copyright Section */}
          <div className="footer-brand">
            <div className="brand" style={{ color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
              <div className="logo" style={{ borderColor: "#fff", color: "#fff", flexShrink: 0 }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
                  alt=""
                  width={56}
                  height={56}
                  style={{ display: "block" }}
                />
              </div>
              <div style={{ minWidth: 0, overflowWrap: "break-word", display: "flex", flexDirection: "column", justifyContent: "center", lineHeight: 1.1 }}>
                {tyBrandLines ? (
                  <>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>
                      {tyBrandLines[0]}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.1, color: "#fff", opacity: 0.9 }}>
                      {tyBrandLines[1]}
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>
                      {tyBrandLines[2]}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 900, color: "#fff", opacity: 0.9 }}>
                      {t("brandTop")}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.1, color: "#fff", opacity: 0.9 }}>
                      {t("brandParliament")}
                    </div>
                    <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800, color: "#fff" }}>
                      {t("brandBottom")}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="footer-copyright">
              <p>{t("© 2025 ВЕРХОВНЫЙ ХУРАЛ РТ.")}</p>
              <p>{t("ВСЕ ПРАВА ЗАЩИЩЕНЫ.")}</p>
              <p className="footer-dev">{t("Разработано Lana Soft")}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-links">
            <div className="footer-col">
              <h4>{t("region")}</h4>
              <nav>
                <a href="/government">{t("government")}</a>
                <a href="/appeals">{t("feedback")}</a>
                <a href="/sitemap">{t("sitemap")}</a>
              </nav>
            </div>
            <div className="footer-col">
              <h4>{t("news")}</h4>
              <nav>
                <a href="/news">{t("hotNews")}</a>
                <a href="/news">{t("allNews")}</a>
              </nav>
            </div>
            <div className="footer-col">
              <h4>{t("docs")}</h4>
              <nav>
                <a href="/pd-policy">{t("pdPolicy")}</a>
                <a href="/license">{t("license")}</a>
              </nav>
            </div>
            <div className="footer-col">
              <h4>{t("socials")}</h4>
              <nav>
                <a href="https://vk.com/public114457376" target="_blank" rel="noreferrer">
                  {t("vk")}
                </a>
                <a href="https://ok.ru" target="_blank" rel="noreferrer">
                  {t("ok")}
                </a>
                <a href="https://rutube.ru" target="_blank" rel="noreferrer">
                  {t("rutube")}
                </a>
              </nav>
            </div>
          </div>

          {/* Contact Information */}
          <div className="footer-contacts">
            <h4>{t("Контакты")}</h4>
            <div className="contact-item">
              <EnvironmentOutlined className="contact-icon" aria-hidden="true" />
              <div className="contact-text">
                <strong>{lang === "ty" ? "АДРЕС:" : "Адрес:"}</strong>{" "}
                <span>{lang === "ty" ? "667000, Кызыл хоорай, Ленина кудумчузу, 32 дугаар бажың." : "667000, г. Кызыл, ул. Ленина, д. 32"}</span>
              </div>
            </div>
            <div className="contact-item">
              <PhoneOutlined className="contact-icon" style={phoneIconStyle} aria-hidden="true" />
              <div className="contact-text">
                <strong>{lang === "ty" ? "ТЕЛЕФОН:" : "Телефон:"}</strong>{" "}
                <a href="tel:+73942297295">+7 (39422) 2-10-43</a>
              </div>
            </div>
            <div className="contact-item">
              <PrinterOutlined className="contact-icon" aria-hidden="true" />
              <div className="contact-text">
                <strong>{lang === "ty" ? "ФАКС:" : "Факс:"}</strong>{" "}
                <span>+7 (39422) 2-16-32</span>
              </div>
            </div>
            <div className="contact-item">
              <MailOutlined className="contact-icon" aria-hidden="true" />
              <div className="contact-text">
                <strong>E-mail:</strong>{" "}
                <a href="mailto:ods@tuva.ru">khural@inbox.ru  </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
