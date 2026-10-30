import React from "react";
import "./GosWidget.css";

const widgetScriptUrl = "https://pos.gosuslugi.ru/bin/script.min.js";
const widgetFormUrl = "https://pos.gosuslugi.ru/form";
let widgetScriptPromise;

function loadWidgetScript() {
  if (typeof window.Widget === "function") return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;

  widgetScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = widgetScriptUrl;
    script.async = true;
    script.onload = () => {
      if (typeof window.Widget === "function") {
        resolve();
      } else {
        reject(new Error("Госуслуги не инициализировали виджет"));
      }
    };
    script.onerror = () => reject(new Error("Не удалось загрузить виджет Госуслуг"));
    document.head.appendChild(script);
  });

  return widgetScriptPromise;
}

export default function GosWidget({ id }) {
  const [loadError, setLoadError] = React.useState("");

  React.useEffect(() => {
    let active = true;

    loadWidgetScript()
      .then(() => {
        if (active) window.Widget(widgetFormUrl, 357458);
      })
      .catch((error) => {
        console.error(error);
        if (active) setLoadError("Виджет не загрузился. Откройте форму на Госуслугах.");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div id={id} className="gos-widget">
      <div id="js-show-iframe-wrapper" className="gos-widget-banner">
        <div className="pos-banner-fluid bf-1">
          <div className="bf-1__decor">
            <div className="bf-1__logo-wrap">
              <img
                className="bf-1__logo"
                src="https://pos.gosuslugi.ru/bin/banner-fluid/gosuslugi-logo.svg"
                alt="Госуслуги"
              />
              <div className="bf-1__slogan">Решаем вместе</div>
            </div>
          </div>
          <div className="bf-1__content">
            <div className="bf-1__description">
              <span className="bf-1__text">Есть вопрос?</span>
              <span className="bf-1__text bf-1__text_small">Напишите нам</span>
            </div>
            <div className="bf-1__btn-wrap">
              <button className="pos-banner-btn_2" type="button">
                Сообщить о проблеме
              </button>
            </div>
          </div>
        </div>
      </div>
      {loadError ? (
        <p className="gos-widget-error" role="alert">
          {loadError} <a href={widgetFormUrl} target="_blank" rel="noopener noreferrer">Перейти к форме</a>
        </p>
      ) : null}
    </div>
  );
}
