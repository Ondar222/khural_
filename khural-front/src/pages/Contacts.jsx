import React from "react";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { useI18n } from "../context/I18nContext.jsx";

function YandexMap({ constructorId, address }) {
  const src = constructorId
    ? `https://yandex.ru/map-widget/v1/?um=constructor%3A${encodeURIComponent(
        constructorId
      )}&source=constructor`
    : `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(
        address || "Кызыл, Республика Тыва"
      )}`;
  return (
    <iframe
      title="Карта"
      src={src}
      width="100%"
      height="640"
      frameBorder="0"
      style={{ 
        borderRadius: 12, 
        display: "block",
        minHeight: 400,
      }}
      allowFullScreen
    />
  );
}

export default function Contacts() {
  const { lang, t } = useI18n();
  const constructorId =
    (typeof window !== "undefined" &&
      window.__YANDEX_CONSTRUCTOR_ID__ &&
      String(window.__YANDEX_CONSTRUCTOR_ID__)) ||
    (import.meta?.env?.VITE_YMAP_CONSTRUCTOR_ID
      ? String(import.meta.env.VITE_YMAP_CONSTRUCTOR_ID)
      : "240dd554e12348d7cb93dd2d2179066c1b72359bf3291990d8b561089130e3a0");
  const address = lang === "ty" 
    ? "667000, Тыва Республика, Кызыл хоорай, Ленина кудумчузу, 32 дугаар бажың"
    : "667000, Республика Тыва, г. Кызыл, ул. Ленина, 32";
  const iconStyle = { fontSize: 20, color: "#0a3b72", flexShrink: 0 };
  const phoneIconStyle = { ...iconStyle, transform: "scaleX(-1)" };

  return (
    <section className="section">
      <div className="container">
        <h1>{t("Контакты")}</h1>
        <div 
          className="grid cols-2" 
          style={{ 
            alignItems: "stretch", 
            gap: 16,
          }}
        >
          <div className="card" style={{ padding: "20px" }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: "clamp(18px, 4vw, 24px)" }}>
              {lang === "ty" ? "Харылзаа медээлери" : "Контактная информация"}
            </h2>
            <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <EnvironmentOutlined style={{ ...iconStyle, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: "clamp(14px, 2.5vw, 18px)", marginRight: 8 }}>
                  {lang === "ty" ? "АДРЕС:" : "Адрес"}
                </span>
                <span style={{ color: "#b91c1c", fontSize: "clamp(13px, 2.2vw, 15px)", lineHeight: 1.5 }}>
                  {address}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <PhoneOutlined style={{ ...phoneIconStyle, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: "clamp(14px, 2.5vw, 18px)", marginRight: 8 }}>
                  {lang === "ty" ? "Хүлээп алыр чер" : "Приемная"}
                </span>
                <span style={{ fontSize: "clamp(12px, 2vw, 14px)", marginRight: 6 }}>
                  {lang === "ty" ? "Телефон/Факс" : "тел/факс:"}
                </span>
                <a 
                  href="tel:+73942221632" 
                  style={{ 
                    color: "inherit", 
                    textDecoration: "none",
                    fontSize: "clamp(13px, 2.2vw, 15px)",
                    fontWeight: 600
                  }}
                >
                  8 (39422) 2-16-32
                </a>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <PhoneOutlined style={{ ...phoneIconStyle, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: "clamp(14px, 2.5vw, 18px)", marginRight: 8 }}>
                  {lang === "ty" ? "Канцелярия" : "Канцелярия"}
                </span>
                <span style={{ fontSize: "clamp(12px, 2vw, 14px)", marginRight: 6 }}>
                  {lang === "ty" ? "Телефон/Факс" : "тел/факс:"}
                </span>
                <a 
                  href="tel:+73942221043" 
                  style={{ 
                    color: "inherit", 
                    textDecoration: "none",
                    fontSize: "clamp(13px, 2.2vw, 15px)",
                    fontWeight: 600
                  }}
                >
                  8 (39422) 2-10-43
                </a>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
              <MailOutlined style={{ ...iconStyle, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: "clamp(14px, 2.5vw, 18px)", marginRight: 8 }}>e-mail:</span>
                <a 
                  href="mailto:khural@inbox.ru" 
                  style={{ 
                    color: "inherit",
                    fontSize: "clamp(13px, 2.2vw, 15px)",
                    wordBreak: "break-word"
                  }}
                >
                  khural@inbox.ru
                </a>
              </div>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <ClockCircleOutlined style={{ ...iconStyle, marginTop: 2 }} aria-hidden="true" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: "clamp(14px, 2.5vw, 18px)", marginRight: 8 }}>
                    {lang === "ty" ? "Ажыл кылыр үези" : "Время работы:"}
                  </span>
                </div>
                <div style={{ fontSize: "clamp(13px, 2.2vw, 15px)", lineHeight: 1.6 }}>
                  {lang === "ty" ? "Дүйзүнден - Беш дүнге чедир: 8.30 - 17.30" : "понедельник - пятница: 8.30 - 17.30"}
                </div>
                <div style={{ fontSize: "clamp(13px, 2.2vw, 15px)", lineHeight: 1.6 }}>
                  {lang === "ty" ? "Чайга ужурар үе: 13.00 - 14.00" : "перерыв на обед: 13.00 - 14.00"}
                </div>
              </div>
            </div>
          </div>
          <div 
            className="card contacts-map-container" 
            style={{ 
              padding: "12px",
              display: "flex", 
              flexDirection: "column",
              minHeight: 0
            }}
          >
            <h2 style={{ 
              margin: "0 0 12px", 
              fontSize: "clamp(18px, 4vw, 22px)"
            }}>
              {lang === "ty" ? "Кылып келири" : "Как добраться"}
            </h2>
            <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <YandexMap constructorId={constructorId} address={address} />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 959px) {
          .grid.cols-2 {
            grid-template-columns: 1fr !important;
          }
          .contacts-map-container {
            margin-top: 16px;
          }
          .contacts-map-container iframe {
            height: 400px !important;
            min-height: 400px !important;
          }
        }
        @media (max-width: 560px) {
          .section .card {
            padding: 16px !important;
          }
          .contacts-map-container iframe {
            height: 350px !important;
            min-height: 350px !important;
          }
        }
        @media (min-width: 960px) {
          .contacts-map-container {
            height: 100%;
          }
          .contacts-map-container iframe {
            height: 100%;
            min-height: 640px;
          }
        }
      `}</style>
    </section>
  );
}
