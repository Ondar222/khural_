import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="cols">
          <div>
            <div className="brand" style={{ color: "#fff" }}>
              <div
                className="logo"
                style={{ borderColor: "#fff", color: "#fff" }}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_arms_of_Tuva.svg"
                  alt=""
                  width={42}
                  height={42}
                />
              </div>
              <div>
                <div style={{ fontSize: 14, lineHeight: 1, opacity: 0.8 }}>
                  {t("brandTop")} <br /> {t("brandParliament")}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.1, fontWeight: 800 }}>
                  {t("brandBottom")}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, color: "#cbd5e1" }}>
            © 2025 ВЕРХОВНЫЙ ХУРАЛ РТ.<br />
            ВСЕ ПРАВА ЗАЩИЩЕНЫ. <br />Разработано Lana Soft
            </div>
          </div>

          <div>
            <strong>{t("region")}</strong>
            <a href="#/government">{t("government")}</a>
            <a href="#/feedback">{t("feedback")}</a>
            <a href="#">{t("sitemap")}</a>
          </div>
          <div>
            <strong>{t("news")}</strong>
            <a href="#/news">{t("hotNews")}</a>
            <a href="#/news">{t("allNews")}</a>
          </div>
          <div>
            <strong>{t("docs")}</strong>
            <a href="#">{t("pdPolicy")}</a>
            <a href="#">{t("license")}</a>
          </div>
          <div>
            <strong>{t("socials")}</strong>
            <a href="#">{t("vk")}</a>
            <a href="#">{t("ok")}</a>
            <a href="#">{t("rutube")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
