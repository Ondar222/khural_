import React from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../context/I18nContext.jsx";
import {
  COOKIE_CATEGORIES,
  COOKIE_CONSENT_OPEN_EVENT,
  acceptAllCookieConsent,
  hasCookieConsent,
  readCookieConsent,
  rejectOptionalCookieConsent,
  saveCookieConsent,
} from "../utils/cookieConsent.js";

/** Текущий выбор пользователя (необходимые категории всегда включены). */
function readSelection() {
  const stored = readCookieConsent();
  const selection = {};
  COOKIE_CATEGORIES.forEach((category) => {
    selection[category.id] = category.required
      ? true
      : stored
        ? stored.categories?.[category.id] === true
        : false;
  });
  return selection;
}

/**
 * Форма согласия на обработку cookie.
 * Показывается до выбора пользователя; изменить решение можно по ссылке в «подвале».
 */
export default function CookieBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = React.useState(() => !hasCookieConsent());
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [selection, setSelection] = React.useState(() => readSelection());

  // Ссылка «Настройки cookie» открывает форму повторно
  React.useEffect(() => {
    const onOpen = () => {
      setSelection(readSelection());
      setSettingsOpen(true);
      // Если решение уже сохранено, баннер не показываем — только окно настроек
      setVisible(!hasCookieConsent());
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  // Escape закрывает окно настроек; блокируем прокрутку страницы под ним
  React.useEffect(() => {
    if (!settingsOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  const close = React.useCallback(() => {
    setSettingsOpen(false);
    setVisible(false);
  }, []);

  const acceptAll = React.useCallback(() => {
    acceptAllCookieConsent();
    close();
  }, [close]);

  const rejectOptional = React.useCallback(() => {
    rejectOptionalCookieConsent();
    close();
  }, [close]);

  const saveSelection = React.useCallback(() => {
    saveCookieConsent(selection);
    close();
  }, [selection, close]);

  const toggleCategory = React.useCallback((id, checked) => {
    setSelection((prev) => ({ ...prev, [id]: checked }));
  }, []);

  if (!visible && !settingsOpen) return null;

  return (
    <>
      {visible ? (
        <div className="cookie-banner" role="region" aria-label={t("Обработка файлов cookie")}>
          <div className="cookie-banner__text">
            <strong>{t("Обработка файлов cookie")}</strong>
            {". "}
            {t(
              "Сайт использует файлы cookie для своей работы. Файлы cookie сторонних сервисов загружаются только после вашего согласия."
            )}{" "}
            <a className="cookie-banner__link" href="/pd-policy">
              {t("Политика обработки персональных данных")}
            </a>
          </div>
          <div className="cookie-banner__actions">
            <button type="button" className="btn btn--primary" onClick={acceptAll}>
              {t("Принять все")}
            </button>
            <button type="button" className="btn" onClick={rejectOptional}>
              {t("Отклонить лишние")}
            </button>
          </div>
        </div>
      ) : null}

      {settingsOpen
        ? createPortal(
            <div
              className="cookie-settings"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSettingsOpen(false);
              }}
            >
              <div
                className="cookie-settings__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="cookie-settings-title"
              >
                <h3 id="cookie-settings-title" style={{ marginTop: 0 }}>
                  {t("Настройки обработки cookie")}
                </h3>
                <p className="cookie-settings__hint">
                  {t("Необходимые файлы cookie обеспечивают работу сайта и не могут быть отключены.")}
                </p>
                <div className="cookie-settings__list">
                  {COOKIE_CATEGORIES.map((category) => (
                    <label
                      key={category.id}
                      className={`cookie-settings__item${
                        category.required ? " cookie-settings__item--locked" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(category.required || selection[category.id])}
                        disabled={Boolean(category.required)}
                        onChange={(e) => toggleCategory(category.id, e.target.checked)}
                      />
                      <span className="cookie-settings__label">
                        <span className="cookie-settings__title">
                          {t(category.title)}
                          {category.required ? ` — ${t("всегда включены")}` : ""}
                        </span>
                        <span className="cookie-settings__desc">{t(category.description)}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="cookie-settings__actions">
                  <button type="button" className="btn btn--primary" onClick={saveSelection}>
                    {t("Сохранить")}
                  </button>
                  <button type="button" className="btn" onClick={rejectOptional}>
                    {t("Отклонить лишние")}
                  </button>
                  <button type="button" className="btn" onClick={acceptAll}>
                    {t("Принять все")}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
