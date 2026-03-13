import React from "react";
import { useI18n } from "../../context/I18nContext.jsx";
import SideNav from "../../components/SideNav.jsx";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function YouthParliamentComposition() {
  const { lang } = useI18n();

  const backText = lang === "ty" 
    ? "Эглири" 
    : lang === "ru" 
      ? "Назад" 
      : "Back";

  const members = [
    "Даржаа Дмитрий Аясович",
    "Конгар Алдын-Ай Аясовна",
    "Кужугет Айрат Альбертович",
    "Куулар Анастасия Алексеевна",
    "Куулар Айдыс Леонидович",
    "Лакпар Аясмаа Александровна",
    "Монгуш Сай-Суу Сайдашовна",
    "Монгуш Арана Аджаровна",
    "Монгуш Владимир Юрьевич",
    "Монгуш Сай-Суу Седиповна",
    "Намчак-оол Айдыс Шолбанович",
    "Ондар Алдын-оол Артемович",
    "Ооржак Буян Эресович",
    "Оюн Тумен Артурович",
    "Саая Ай-Даш Чечек-оолович",
    "Самдарак Шолбана Хереловна",
    "Сат Ёнмина Шолбановна",
    "Севек Аганак Оюн-оолович",
    "Сумбаа Аделина Оттук-оолвна",
    "Тамдын-оол Батый Евгеньевич",
    "Товарищтай Иргек Игоревич",
    "Тюлюш Кежиктиг Серенмилович",
    "Хертек Эдиски Олегович",
    "Хомушку Айда-Сай Алексеевна",
    "Хургул-оол Аян Аясович",
    "Чымба Антон Альбертович",
    "Шожут Саглан Владимировна",
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: "16px" }}>
              <a 
                href="/youth-parliament" 
                className="btn" 
                style={{ 
                  display: "inline-flex", 
                  alignItems: "center", 
                  gap: "6px",
                  background: "#ffffff",
                  border: "1px solid #d9d9d9",
                  color: "#003366",
                  padding: "6px 16px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#f5f5f5";
                  e.target.style.borderColor = "#bfbfbf";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#ffffff";
                  e.target.style.borderColor = "#d9d9d9";
                }}
              >
                <ArrowLeftOutlined /> {backText}
              </a>
            </div>
            <h1>Состав Молодежного Хурала</h1>

            <div className="card" style={{ padding: "24px", marginTop: "24px" }}>
              <div style={{ textAlign: "center", marginBottom: "32px" }}>
                <p style={{ fontWeight: 700, fontSize: "18px", marginBottom: "16px" }}>
                  Об утверждении состава Молодежного Хурала (парламента) Республики Тыва четвертого созыва
                </p>
              </div>

              <div style={{ lineHeight: 1.8 }}>
                <p>
                  В соответствии с пунктом 3.5 Положения о Молодежном Хурале (парламенте) Республики Тыва, 
                  утвержденного постановлением Верховного Хурала (парламента) Республики Тыва от 27 июня 2011 
                  года № 796 ВХ-I, Верховный Хурал (парламент) Республики Тыва постановляет:
                </p>

                <p style={{ fontWeight: 600, marginTop: "24px" }}>
                  1. Утвердить следующий состав Молодежного Хурала (парламента) Республики Тыва четвертого созыва:
                </p>

                <ol style={{ 
                  paddingLeft: "24px", 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "8px",
                  listStylePosition: "outside"
                }}>
                  {members.map((member, index) => (
                    <li key={index} style={{ padding: "8px 12px", background: "#f9fafb", borderRadius: "6px" }}>
                      {member}
                    </li>
                  ))}
                </ol>

                <div style={{ marginTop: "32px" }}>
                  <p style={{ fontWeight: 600 }}>2. Опубликовать настоящее постановление на официальном сайте Верховного Хурала (парламента) Республики Тыва.</p>
                  <p style={{ fontWeight: 600 }}>3. Настоящее постановление вступает в силу со дня его принятия.</p>
                </div>

                <div style={{ marginTop: "48px", textAlign: "right" }}>
                  <p style={{ fontWeight: 600 }}>Председатель Верховного Хурала</p>
                  <p style={{ fontWeight: 600 }}>(парламента) Республики Тыва</p>
                  <p style={{ fontWeight: 700, marginTop: "24px" }}>К. Даваа</p>
                </div>

                <div style={{ marginTop: "32px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                  <p>г. Кызыл</p>
                  <p>19 февраля 2025 г.</p>
                  <p>№ _______ ПВХ-IV</p>
                </div>
              </div>
            </div>
          </div>
          <SideNav
            title={lang === "ty" ? "Аныяктар Хуралы" : "Молодежный Хурал"}
            loadPages={true}
            autoSection={true}
          />
        </div>
      </div>
    </section>
  );
}
