import React from "react";
import {
  HomeOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  MessageOutlined,
  ContactsOutlined,
  GlobalOutlined,
  UserOutlined,
  ReadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useI18n } from "../context/I18nContext.jsx";

const ICONS = {
  home: <HomeOutlined />,
  deputies: <TeamOutlined />,
  docs: <FileTextOutlined />,
  calendar: <CalendarOutlined />,
  list: <UnorderedListOutlined />,
  messages: <MessageOutlined />,
  contacts: <ContactsOutlined />,
  global: <GlobalOutlined />,
  user: <UserOutlined />,
  read: <ReadOutlined />,
  lightning: <ThunderboltOutlined />,
};

const SECTIONS = [
  {
    title: "Общие",
    icon: ICONS.home,
    links: [
      { label: "Главная", href: "/" },
      { label: "О Верховном Хурале", href: "/about" },
      { label: "Контакты", href: "/contacts" },
      { label: "Структура органов управления", href: "/about?tab=structure" },
      { label: "Представительство в Совете Федерации", href: "/struct/council" },
      { label: "Молодежный Хурал", href: "/youth-parliament" },
    ],
  },
  {
    title: "Депутаты",
    icon: ICONS.deputies,
    links: [
      { label: "Депутаты", href: "/deputies" },
      { label: "Бывшие депутаты", href: "/deputies/ended" },
    ],
  },
  {
    title: "Власть",
    icon: ICONS.list,
    links: [
      { label: "Руководство", href: "/government" },
      { label: "Комитеты", href: "/section" },
      { label: "Комиссии", href: "/commission?id=mezhregionalnye-svyazi" },
      { label: "Фракции", href: "/deputies" },
      { label: "Аппарат Верховного Хурала", href: "/apparatus" },
      { label: "Властные полномочия", href: "/authorities" },
      { label: "Календарь", href: "/calendar" },
      { label: "Трансляции", href: "/broadcast" },
      { label: "Действия", href: "/activity" },
      { label: "Карта", href: "/map" },
    ],
  },
  {
    title: "Документы и законы",
    icon: ICONS.docs,
    links: [
      { label: "Документы", href: "/documents" },
      { label: "Законы Республики Тыва", href: "/docs/laws" },
      { label: "Постановления ВХ РТ", href: "/docs/resolutions" },
      { label: "Законодательные инициативы", href: "/docs/initiatives" },
      { label: "Нормативные документы", href: "/docs" },
    ],
  },
  {
    title: "Новости",
    icon: ICONS.lightning,
    links: [
      { label: "Все новости", href: "/news" },
      { label: "Архив новостей", href: "/news/archive" },
    ],
  },
  {
    title: "Обращения граждан",
    icon: ICONS.messages,
    links: [
      { label: "Обращения", href: "/appeals" },
      { label: "Как обратиться онлайн", href: "/appeals/online" },
      { label: "Обращение по почте", href: "/appeals/letter" },
      { label: "Разъяснение", href: "/appeals/review" },
      { label: "Жалоба", href: "/appeals/complaints" },
      { label: "Обзор обращений", href: "/appeals/overview" },
      { label: "Общественные интересы", href: "/appeals/public-interests" },
      { label: "Юридическая помощь", href: "/appeals/legal" },
      { label: "График приема", href: "/appeals/schedule" },
      { label: "Минюст", href: "/appeals/minyust" },
    ],
  },
  {
    title: "Информация",
    icon: ICONS.read,
    links: [
      { label: "Финансы и бюджет", href: "/info/finansy" },
      { label: "Бюджет для граждан", href: "/info/finansy/byudzhet" },
      { label: "Законодательная карта", href: "/info/zakon-karta" },
      { label: "Выборные округа", href: "/info/iokrug" },
      { label: "Полномочия спикера", href: "/info/speaker-powers" },
      { label: "Контакты", href: "/info/contacts" },
      { label: "Право ребенка", href: "/info/child-rights" },
      { label: "Государственные символы", href: "/info/symbols" },
      { label: "Открытые данные", href: "/opendata" },
      { label: "Приграничный субъект", href: "/info/border-subject" },
      { label: "Противодействие коррупции", href: "/info/anti-corruption" },
    ],
  },
  {
    title: "Молодежный Хурал",
    icon: ICONS.user,
    links: [
      { label: "Главная", href: "/youth-parliament" },
      { label: "Положение", href: "/youth-parliament/regulation" },
      { label: "Состав", href: "/youth-parliament/composition" },
      { label: "Отчеты", href: "/youth-parliament/reports" },
      { label: "Отчет 2015", href: "/youth-parliament/reports/2015" },
      { label: "Отчет 2016", href: "/youth-parliament/reports/2016" },
      { label: "Отчет 2017", href: "/youth-parliament/reports/2017" },
      { label: "Отчет 2018", href: "/youth-parliament/reports/2018" },
      { label: "Отчет 2020", href: "/youth-parliament/reports/2020" },
      { label: "Контакты", href: "/youth-parliament/contacts" },
      { label: "Повестка", href: "/youth-parliament/agendas" },
      { label: "Проект Дүза", href: "/youth-parliament/duza-project" },
      { label: "Правила", href: "/youth-parliament/rules" },
    ],
  },
  {
    title: "О сайте",
    icon: ICONS.global,
    links: [
      { label: "Политика обработки ПДн", href: "/pd-policy" },
      { label: "Лицензия", href: "/license" },
      { label: "Карта сайта", href: "/sitemap" },
      { label: "Информация о сайте", href: "/pages" },
    ],
  },
];

function SectionCard({ section }) {
  return (
    <div className="card sitemap-card">
      <div className="sitemap-card__header">
        <div className="sitemap-card__icon-wrap">
          <span style={{ color: "#fff" }}>{section.icon}</span>
        </div>
        <h3 className="sitemap-card__title">{section.title}</h3>
        <span className="sitemap-card__badge">{section.links.length}</span>
      </div>
      <ul className="sitemap-card__list">
        {section.links.map((link) => (
          <li key={link.href}>
            <a className="sitemap-card__link" href={link.href}>
              <span className="sitemap-card__link-text">{link.label}</span>
              <svg className="sitemap-card__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Sitemap() {
  const { lang } = useI18n();

  return (
    <section className="section">
      <div className="container">
        {/* Hero header */}
        <div className="sitemap-hero">
          <div className="sitemap-hero__content-inner">
            <h1 className="sitemap-hero__title">{lang === "ty" ? "Сайтының картазы" : "Карта сайта"}</h1>
            <p className="sitemap-hero__subtitle">
              {lang === "ty"
                ? "Шупту разделдер болгаш хуудастар"
                : "Все разделы и страницы сайта"}
            </p>
            <div className="sitemap-hero__stats">
              <div className="sitemap-stat">
                <span className="sitemap-stat__value">{SECTIONS.length}</span>
                <span className="sitemap-stat__label">разделов</span>
              </div>
              <div className="sitemap-stat-divider" />
              <div className="sitemap-stat">
                <span className="sitemap-stat__value">
                  {SECTIONS.reduce((sum, s) => sum + s.links.length, 0)}
                </span>
                <span className="sitemap-stat__label">страниц</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="sitemap-grid">
          {SECTIONS.map((s) => (
            <SectionCard key={s.title} section={s} />
          ))}
        </div>
      </div>

      <style>{`
        .sitemap-hero {
          margin-bottom: 36px;
        }
        .sitemap-hero__content-inner {
          background: linear-gradient(180deg, #003366 0%, #002244 100%);
          border-radius: 20px;
          padding: 36px 32px 32px;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .sitemap-hero__content-inner::before {
          content: "";
          position: absolute;
          top: -50%;
          right: -20%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .sitemap-hero__content-inner::after {
          content: "";
          position: absolute;
          bottom: -30%;
          left: -10%;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .sitemap-hero__title {
          margin: 0 0 8px;
          font-size: 28px;
          color: #fff;
          font-family: "Merriweather", serif;
          position: relative;
          z-index: 1;
        }
        .sitemap-hero__subtitle {
          margin: 0 0 24px;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
          position: relative;
          z-index: 1;
        }
        .sitemap-hero__stats {
          display: inline-flex;
          align-items: center;
          gap: 20px;
          position: relative;
          z-index: 1;
        }
        .sitemap-stat {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .sitemap-stat__value {
          font-size: 32px;
          font-weight: 900;
          color: #ffd700;
          line-height: 1;
        }
        .sitemap-stat__label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1;
        }
        .sitemap-stat-divider {
          width: 1px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
        }

        /* ===== Grid ===== */
        .sitemap-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 640px) {
          .sitemap-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1080px) {
          .sitemap-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* ===== Card ===== */
        .sitemap-card {
          padding: 0;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .sitemap-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0, 51, 102, 0.14);
        }

        .sitemap-card__header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px 16px;
          background: linear-gradient(135deg, #003366 0%, #0a1f44 100%);
          position: relative;
        }
        .sitemap-card__header::after {
          content: "";
          position: absolute;
          top: -50%;
          right: -10%;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .sitemap-card__icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.14);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          font-size: 18px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .sitemap-card__title {
          margin: 0;
          font-size: 17px;
          font-weight: 800;
          color: #fff;
          font-family: "Merriweather", serif;
          flex: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          position: relative;
          z-index: 1;
        }
        .sitemap-card__badge {
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          font-size: 12px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          flex-shrink: 0;
          min-width: 28px;
          text-align: center;
          border: 1px solid rgba(255, 215, 0, 0.3);
          position: relative;
          z-index: 1;
        }

        /* ===== List ===== */
        .sitemap-card__list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .sitemap-card__list li {
          border-top: 1px solid #f3f4f6;
        }
        .sitemap-card__list li:first-child {
          border-top: none;
        }

        .sitemap-card__link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 20px;
          text-decoration: none;
          color: #374151;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.15s ease, color 0.15s ease, padding-left 0.2s ease;
        }
        .sitemap-card__link:hover {
          background: #f8fafc;
          color: #0a3b72;
          padding-left: 24px;
        }
        .sitemap-card__link-text {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sitemap-card__chevron {
          color: #d1d5db;
          flex-shrink: 0;
          margin-left: 12px;
          transition: color 0.15s ease, transform 0.2s ease;
        }
        .sitemap-card__link:hover .sitemap-card__chevron {
          color: #0a3b72;
          transform: translateX(3px);
        }

        /* ===== Responsive ===== */
        @media (max-width: 719px) {
          .sitemap-hero__content-inner {
            padding: 28px 20px 24px;
          }
          .sitemap-hero__title {
            font-size: 22px;
          }
          .sitemap-hero__subtitle {
            font-size: 14px;
          }
          .sitemap-stat__value {
            font-size: 26px;
          }
          .sitemap-card__header {
            padding: 16px 16px 12px;
          }
          .sitemap-card__title {
            font-size: 15px;
          }
          .sitemap-card__link {
            padding: 11px 16px;
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}













