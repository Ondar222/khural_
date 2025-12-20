import React from "react";

export default function CookieBanner() {
  const [visible, setVisible] = React.useState(() => {
    try {
      return localStorage.getItem("cookieConsent") !== "1";
    } catch {
      return true;
    }
  });

  const accept = () => {
    try {
      localStorage.setItem("cookieConsent", "1");
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;
  return (
    <div className="cookie-banner" role="region" aria-label="Уведомление о cookies">
      <div className="cookie-banner__text">
        Мы используем файлы cookies для улучшения работы сайта. Продолжая пользоваться сайтом, вы
        соглашаетесь с использованием cookies.
        <a className="link" href="/about" style={{ marginLeft: 8 }}>
          Подробнее
        </a>
      </div>
      <div className="cookie-banner__actions">
        <button className="btn" onClick={accept}>
          Принять
        </button>
      </div>
    </div>
  );
}
