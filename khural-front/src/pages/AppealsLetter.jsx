import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsLetter() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("Обращения граждан и юридических лиц")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Письменные обращения граждан и работа с ними регламентируется законом РФ «О порядке рассмотрения
            обращений граждан Российской Федерации» №59-ФЗ от 02.05.2006 г.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
            Просьбы о решении различных проблемных вопросов и ситуаций могут направляться в государственные органы в
            письменной форме в виде предложения, заявления или жалобы.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.6 }}>
            Письменное обращение можно:
          </p>
        </div>

        <div className="tile" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            Отправить по почте по адресу:
          </h2>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#f0f9ff", 
            border: "1px solid #bae6fd", 
            borderRadius: "8px",
            marginBottom: 16 
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              667000, Тыва респ, г Кызыл, улица Ленина, 32
            </p>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
            Передать лично по адресу:
          </h2>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "#f0f9ff", 
            border: "1px solid #bae6fd", 
            borderRadius: "8px",
            marginBottom: 8
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              667000, Тыва респ, г Кызыл, улица Ленина, 32
            </p>
            <p style={{ fontSize: 15, marginBottom: 0 }}>
              <strong>Режим работы:</strong> пн-пт 09:00-18:00, суббота и воскресенье - выходные
            </p>
          </div>
        </div>

        <div className="tile" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 0, marginBottom: 20 }}>
            Шаблон заявления для граждан
          </h2>

          <div style={{ 
            padding: "24px", 
            backgroundColor: "#ffffff", 
            border: "2px solid #e5e7eb", 
            borderRadius: "8px",
            marginBottom: 16
          }}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Название: Шаблон заявления для граждан
            </p>
            <p style={{ fontSize: 15, marginBottom: 16 }}>
              Документ:{" "}
              <a href="https://khural.rtyva.ru/upload/iblock/ba1/6uy6y7lvo0v49q3xckx35hhfvzw4ydeo/6abb1ffa9896e48c62843b9fbba2c3ec.docx" className="link" download>
                Загрузить
              </a>
            </p>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
              Требования к письменному обращению
            </h3>

            <ol style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 24, marginBottom: 20 }}>
              <li>
                Гражданин в своем письменном обращении в обязательном порядке указывает либо наименование
                государственного органа или органа местного самоуправления, в которые направляет письменное
                обращение, либо фамилию, имя, отчество соответствующего должностного лица, либо должность
                соответствующего лица, а также свои фамилию, имя, отчество (последнее - при наличии), почтовый адрес,
                по которому должны быть направлены ответ, уведомление о переадресации обращения, излагает суть
                предложения, заявления или жалобы, ставит личную подпись и дату.
              </li>
              <li>
                В случае необходимости в подтверждение своих доводов гражданин прилагает к письменному обращению
                документы и материалы либо их копии.
              </li>
              <li>
                Обращение, поступившее в государственный орган, орган местного самоуправления или должностному лицу
                в форме электронного документа, подлежит рассмотрению в порядке, установленном настоящим Федеральным
                законом. В обращении гражданин в обязательном порядке указывает свои фамилию, имя, отчество
                (последнее - при наличии), адрес электронной почты, по которому должны быть направлены ответ,
                уведомление о переадресации обращения. Гражданин вправе приложить к такому обращению необходимые
                документы и материалы в электронной форме.
              </li>
            </ol>

            <p style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              padding: "16px", 
              backgroundColor: "#fef3c7", 
              border: "1px solid #fbbf24",
              borderRadius: "6px",
              marginBottom: 0
            }}>
              Срок рассмотрения писем граждан и исполнения поручений по ним{" "}
              <strong>не должен превышать 30 календарных дней со дня регистрации письма.</strong>
            </p>
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 20 }}>
            <a href="/appeals/review" className="link" style={{ fontSize: 15 }}>
              Порядок рассмотрения обращений
            </a>
            <a href="/appeals/complaints" className="link" style={{ fontSize: 15 }}>
              Порядок обжалования
            </a>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <a href="/appeals" className="btn">
            &larr; Назад к способам подачи обращений
          </a>
        </div>
      </div>
    </section>
  );
}
