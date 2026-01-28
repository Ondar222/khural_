import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { Alert } from "antd";

export default function AppealsStatus() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Проверить статус обращения")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Для проверки статуса обращения, направленного в Верховный Хурал (парламент) Республики Тыва, необходимо
            знать регистрационный номер обращения и дату его подачи. Указанные сведения указываются в уведомлении о
            приёме обращения.
          </p>
          <Alert
            type="info"
            showIcon
            message="Проверка статуса обращения"
            description={
              <span>
                Если вы подавали обращение через электронную приёмную на данном сайте, статус можно увидеть в
                разделе «Мои обращения» после{" "}
                <a href="/login" className="link">входа</a> в личный кабинет. Для обращений, поданных по почте или
                лично, уточнить статус можно по телефонам приёмной Верховного Хурала, указанным в разделе{" "}
                <a href="/contacts" className="link">Контакты</a>, либо на официальном портале:{" "}
                <a href="https://khural.rtyva.ru/internet-priemnaya/" target="_blank" rel="noopener noreferrer" className="link">
                  khural.rtyva.ru/internet-priemnaya
                </a>
              </span>
            }
            style={{ marginBottom: 24 }}
          />
          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 0 }}>
            Обращения рассматриваются в течение 30 дней со дня регистрации. В отдельных случаях срок может быть
            продлён не более чем на 30 дней с уведомлением заявителя.
          </p>
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
          <a href="/appeals/online" className="btn btn--primary">
            Электронная приемная (Мои обращения)
          </a>
          <a href="/appeals" className="btn">
            &larr; Назад к способам подачи обращений
          </a>
        </div>
      </div>
    </section>
  );
}
