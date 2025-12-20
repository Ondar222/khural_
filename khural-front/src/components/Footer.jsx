import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand and Copyright Section */}
          <div className="footer-brand">
            <div className="brand" style={{ color: "#fff" }}>
              <div className="logo" style={{ borderColor: "#fff", color: "#fff" }}>
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
                  alt=""
                  width={40}
                  height={40}
                />
              </div>
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}>
                <div style={{ fontSize: 13, lineHeight: 1.2, opacity: 0.9 }}>
                  {t("brandTop")} <br /> {t("brandParliament")}
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.2, fontWeight: 800, marginTop: 3 }}>
                  {t("brandBottom")}
                </div>
              </div>
            </div>
            <div className="footer-copyright">
              <p>© 2025 ВЕРХОВНЫЙ ХУРАЛ РТ.</p>
              <p>ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
              <p className="footer-dev">Разработано Lana Soft</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="footer-links">
            <div className="footer-col">
              <h4>{t("region")}</h4>
              <nav>
                <a href="/government">{t("government")}</a>
                <a href="/feedback">{t("feedback")}</a>
                <a href="#">{t("sitemap")}</a>
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
                <a href="#">{t("pdPolicy")}</a>
                <a href="#">{t("license")}</a>
              </nav>
            </div>
            <div className="footer-col">
              <h4>{t("socials")}</h4>
              <nav>
                <a href="#">{t("vk")}</a>
                <a href="#">{t("ok")}</a>
                <a href="#">{t("rutube")}</a>
              </nav>
            </div>
          </div>

          {/* Contact Information */}
          <div className="footer-contacts">
            <h4>Контакты</h4>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div className="contact-text">
                <strong>Адрес:</strong>
                <span>667000, г. Кызыл, ул. Чульдум, д. 18</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div className="contact-text">
                <strong>Телефон:</strong>
                <a href="tel:+73942297295">+7 (39422) 9-72-95</a>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📠</span>
              <div className="contact-text">
                <strong>Факс:</strong>
                <span>+7 (39422) 9-72-95, 9-72-96</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <div className="contact-text">
                <strong>E-mail:</strong>
                <a href="mailto:ods@tuva.ru">ods@tuva.ru</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
