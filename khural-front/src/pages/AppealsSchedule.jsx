import React from "react";
import { useI18n } from "../context/I18nContext.jsx";

export default function AppealsSchedule() {
  const { t } = useI18n();

  return (
    <section className="section">
      <div className="container">
        <h1 className="h1-compact">{t("График приема граждан")}</h1>

        <div className="tile" style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
            Приём граждан в Верховном Хурале (парламенте) Республики Тыва осуществляется в соответствии с
            установленным графиком. При обращении при себе необходимо иметь документ, удостоверяющий личность.
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            Адрес приёма
          </h2>
          <div style={{
            padding: "20px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: "8px",
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              667000, Республика Тыва, г. Кызыл, ул. Ленина, 32
            </p>
            <p style={{ fontSize: 15, marginBottom: 0 }}>
              Верховный Хурал (парламент) Республики Тыва
            </p>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 16 }}>
            Режим работы
          </h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, marginLeft: 24, marginBottom: 16 }}>
            <li>Понедельник — пятница: с 09:00 до 18:00</li>
            <li>Суббота, воскресенье — выходные дни</li>
            <li>Обеденный перерыв: с 13:00 до 14:00</li>
          </ul>

          <p style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 0 }}>
            Для уточнения графика приёма депутатов и руководителей органов Верховного Хурала обращайтесь в приёмную
            по телефонам, указанным в разделе «Контакты». Предварительная запись может быть обязательной.
          </p>
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
