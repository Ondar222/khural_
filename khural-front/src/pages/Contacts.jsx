import React from "react";
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";

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
      height="400"
      frameBorder="0"
      style={{ borderRadius: 12 }}
      allowFullScreen
    />
  );
}

export default function Contacts() {
  const constructorId =
    (typeof window !== "undefined" &&
      window.__YANDEX_CONSTRUCTOR_ID__ &&
      String(window.__YANDEX_CONSTRUCTOR_ID__)) ||
    (import.meta?.env?.VITE_YMAP_CONSTRUCTOR_ID
      ? String(import.meta.env.VITE_YMAP_CONSTRUCTOR_ID)
      : "240dd554e12348d7cb93dd2d2179066c1b72359bf3291990d8b561089130e3a0");
  const address = "667000, Республика Тыва, г. Кызыл, ул. Ленина, 32";
  const iconStyle = { fontSize: 20, color: "#0a3b72", flexShrink: 0 };
  const phoneIconStyle = { ...iconStyle, transform: "scaleX(-1)" };

  return (
    <section className="section">
      <div className="container">
        <h1>Контакты</h1>
        <div className="grid cols-2" style={{ alignItems: "stretch", gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Контактная информация</h2>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <EnvironmentOutlined style={iconStyle} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 20 }}>Адрес</div>
              </div>
              <div style={{ color: "#b91c1c" }}>{address}</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <PhoneOutlined style={phoneIconStyle} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 20 }}>Приемная</div>
              </div>
              <p>Телефон/Факс</p>
              <div style={{ marginBottom: "10px" }}>8 (39422) 2-16-32</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <PhoneOutlined style={phoneIconStyle} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 20 }}>Канцелярия</div>
              </div>
              <p>Телефон/Факс</p>
              <div style={{ marginBottom: "10px" }}> 8 (39422) 2-10-43</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <MailOutlined style={iconStyle} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 20 }}>Email</div>
              </div>
              <div>khural@inbox.ru </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <ClockCircleOutlined style={iconStyle} aria-hidden="true" />
                <div style={{ fontWeight: 700, fontSize: 20 }}>Режим работы</div>
              </div>
              <div>Пн‑Пт: 08:30 – 17:30</div>
              <div>Перерыв на обед: 13:00 – 14:00</div>
            </div>
          </div>
          <div className="card" style={{ padding: 12 }}>
            <h2 style={{ margin: "0 0 12px" }}>Как добраться</h2>
            <YandexMap constructorId={constructorId} address={address} />
          </div>
        </div>
      </div>
    </section>
  );
}
