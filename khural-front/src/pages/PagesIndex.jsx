import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import DataState from "../components/DataState.jsx";
import { getPreferredLocaleToken } from "../utils/pages.js";
import { pickMenuLabel } from "../utils/pagesOverrides.js";

// Статический список всех доступных страниц (используется когда API пуст или недоступен)
const STATIC_PAGES = [
  { slug: "info", title: "Общие сведения" },
  { slug: "info/finansy", title: "Финансы" },
  { slug: "info/finansy/rezultaty-proverok", title: "Результаты проверок" },
  { slug: "info/finansy/goszakupki", title: "Государственные закупки" },
  { slug: "info/finansy/otcheti", title: "Отчеты" },
  { slug: "info/finansy/byudzhet", title: "Бюджет" },
  { slug: "info/iokrug", title: "Избирательные округа" },
  { slug: "info/zakon-karta", title: "Законодательная карта сайта" },
  { slug: "info/upoln-po-prav", title: "Уполномоченный по правам человека" },
  { slug: "info/upoln-po-reb", title: "Уполномоченный по правам ребенка" },
  { slug: "info/polnomochiya-spikera", title: "Полномочия Председателя" },
  { slug: "info/polnomochiya", title: "Полномочия Верховного Хурала" },
  { slug: "info/protivodeystvie-korrupcii", title: "Противодействие коррупции" },
  { slug: "info/protivodeystvie-korrupcii/normativnye-akty", title: "Нормативные правовые акты (коррупция)" },
  { slug: "info/protivodeystvie-korrupcii/komissiya-deputatov", title: "Комиссия депутатов по контролю за достоверностью сведений о доходах" },
  { slug: "info/protivodeystvie-korrupcii/komissiya-deputatov/vypiski-protokoly", title: "Выписки, протоколы, решения" },
  { slug: "info/protivodeystvie-korrupcii/komissiya-deputatov/informatsiya", title: "Информация о деятельности Комиссии" },
  { slug: "info/protivodeystvie-korrupcii/metodicheskie-materialy", title: "Методические материалы" },
  { slug: "info/protivodeystvie-korrupcii/obratnaya-svyaz", title: "Обратная связь по вопросам противодействия коррупции" },
  { slug: "info/protivodeystvie-korrupcii/formy-dokumentov", title: "Формы документов для заполнения" },
  { slug: "info/protivodeystvie-korrupcii/spavki-bk", title: "СПО \"Справки БК\"" },
  { slug: "info/protivodeystvie-korrupcii/protivodeystvie-korrupcii-plan", title: "План противодействия коррупции" },
  { slug: "info/contacts", title: "Контактная информация" },
  { slug: "info/gosudarstvennye-simvoly", title: "Государственные символы Республики Тыва" },
  { slug: "info/prigranichny-subekt", title: "Приграничный субъект" },
  { slug: "info/prigranichny-subekt/shablony", title: "Шаблоны заявлений и ходатайств" },
  { slug: "info/prigranichny-subekt/shema-uslugi", title: "Схема предоставления услуги" },
  { slug: "info/prigranichny-subekt/individualny-propusk", title: "Ходатайство на получение индивидуального пропуска" },
  { slug: "info/prigranichny-subekt/kollektivny-propusk", title: "Ходатайство на получение коллективного пропуска" },
  { slug: "info/prigranichny-subekt/zayavlenie-zakonnogo-predstavitelya", title: "Заявление законного представителя" },
  { slug: "info/prigranichny-subekt/zayavlenie-individualny-propusk", title: "Заявление на индивидуальный пропуск" },
  { slug: "info/prigranichny-subekt/zayavlenie-kollektivny-propusk", title: "Заявление на коллективный пропуск" },
  { slug: "info/prigranichny-subekt/zayavlenie-promyslovaya-deyatelnost", title: "Заявление на промысловую деятельность" },
  { slug: "info/prigranichny-subekt/zayavlenie-hoz-deyatelnost", title: "Заявление на разрешение хоз. деятельности" },
  { slug: "info/personnel", title: "Кадровое обеспечение" },
  { slug: "info/personnel/gosgrazhdanskaya-sluzhba", title: "Государственная гражданская служба" },
  { slug: "info/personnel/poryadok-postupleniya", title: "Порядок поступления граждан на государственную гражданскую службу" },
  { slug: "info/personnel/vakansii", title: "Сведения о вакантных должностях и квалификационные требования" },
  { slug: "info/personnel/konkursy", title: "Результаты проведения конкурсов" },
  { slug: "info/personnel/telefon-spravok", title: "Телефон для справок по вопросу замещения вакантных должностей" },
  { slug: "info/personnel/metodika-konkursa", title: "Методика проведения конкурса на замещение вакантной должности" },
  { slug: "info/personnel/poryadok-obzhalovaniya", title: "Порядок обжалования результатов конкурса" },
  { slug: "info/personnel/komissii", title: "Комиссии" },
  { slug: "info/personnel/dokumenty-pri-postuplenii", title: "Документы необходимые при поступлении на государственную гражданскую службу" },
  { slug: "info/personnel/pensionnoe-obespechenie", title: "Новый порядок пенсионного обеспечения государственных служащих" },
  { slug: "info/personnel/otpusk-sluzhaschih", title: "Об уменьшении продолжительности отпуска государственных служащих" },
  { slug: "info/personnel/law-58fz", title: "Федеральный закон от 25.12.2008 № 273-ФЗ \"О противодействии коррупции\"" },
  { slug: "info/personnel/law-79fz", title: "Федеральный закон от 27.07.2004 № 79-ФЗ \"О государственной гражданской службе РФ\"" },
  { slug: "info/personnel/law-112", title: "Указ Президента РФ от 01.02.2005 № 112 \"О конкурсе на замещение вакантной должности государственной гражданской службы РФ\"" },
  { slug: "opendata", title: "Открытые данные" },
  { slug: "code-of-honor", title: "Кодекс чести мужчины Тувы" },
  { slug: "mothers-commandments", title: "Свод заповедей матерей Тувы" },
  { slug: "for-media", title: "Для СМИ" },
  { slug: "about/istoriya-parlamentarizma", title: "История парламентаризма в Туве" },
  { slug: "about/finances", title: "Финансы (О Хурале)" },
];

export default function PagesIndex() {
  const { lang } = useI18n();
  const locale = getPreferredLocaleToken(lang);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await AboutApi.listPages({ locale });
        if (!alive) return;
        const arr = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        if (arr.length > 0) {
          setItems(arr);
        } else {
          setItems(STATIC_PAGES);
        }
      } catch (e) {
        if (!alive) return;
        setError(e);
        setItems(STATIC_PAGES);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang, locale]);

  return (
    <section className="section">
      <div className="container">
        <h1>Страницы</h1>
        <DataState loading={loading} error={error} empty={!loading && items.length === 0} emptyDescription="Страниц нет">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "grid", gap: 10 }}>
              {(items || []).map((p) => {
                const slug = String(p.slug || "");
                const segs = slug.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
                // Для страниц с разделом используем /section/slug, для остальных /p/slug
                const href = segs.length >= 2 ? `/${segs.join("/")}` : `/p/${segs.join("/")}`;
                const label = pickMenuLabel(p, locale, { prefer: "menu" }) || p.title || p.slug;
                return (
                  <a
                    key={String(p.id || p.slug || Math.random())}
                    className="link"
                    href={href}
                    style={{ fontWeight: 700 }}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        </DataState>
      </div>
    </section>
  );
}



