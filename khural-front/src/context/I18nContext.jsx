import React from "react";
import { PublicApi } from "../api/client.js";

const dict = {
  ru: {
    home: "Главная",
    aboutVH: "О Верховном Хурале",
    structure: "Структура",
    committees: "Комитеты",
    commissions: "Комиссии",
    factions: "Депутатские фракции",
    senateRep: "Представительство в Совете Федерации",
    apparatus: "Аппарат",
    brandTop: "ВЕРХОВНЫЙ ХУРАЛ",
    brandParliament: "(парламент)",
    brandBottom: "РЕСПУБЛИКИ ТЫВА",
    more: "Подробнее",
    news: "Новости",
    calendar: "Календарь",
    calendarOpen: "Открыть в разделе",
    prevMonth: "Предыдущий месяц",
    nextMonth: "Следующий месяц",
    documents: "Документы",
    deputies: "Депутаты",
    appeals: "Обращения",
    media: "Медиа",
    sessions: "Сессии",
    legislation: "Законодательство",
    publicEvents: "Общественные мероприятия",
    workWithCitizens: "Работа с гражданами",
    allNews: "Все новости",
    hotNews: "Актуальные новости",
    search: "Поиск",
    category: "Категория",
    month: "Месяц",
    priorities: "Приоритеты",
    openAllPriorities: "Открыть все приоритеты",
    achievementsTitle: "Достижения региона",
    achievementsMore: "Больше достопримечательностей",
    region: "О регионе",
    government: "Парламент",
    authorities: "Органы власти",
    docs: "Документы",
    feedback: "Прием обращений",
    press: "Пресс‑служба",
    activity: "Деятельность",
    contacts: "Контакты",
    login: "Вход",
    register: "Регистрация",
    back: "← К списку",
    otherNews: "Другие новости",
    head: "Глава",
    deputiesAll: "Депутаты всех созывов",
    docsLaws: "Законы Республики Тыва",
    docsResolutions: "Постановления ВХ РТ",
    docsInitiatives: "Законодательные инициативы",
    docsCivic: "Инициатива гражданами",
    docsConstitution: "Поправки в Конституцию РФ",
    docsBills: "Законопроекты",
    wifiMap: "Карта WiFi",
    map: "Карта",
    sitemap: "Карта сайта",
    pdPolicy: "Политика обработки ПДн",
    license: "Лицензия",
    socials: "Соцсети",
    vk: "ВКонтакте",
    ok: "Одноклассники",
    rutube: "RuTube",
  },
  ty: {
    home: "Башкы",
    aboutVH: "Дээди Хурал дугайында",
    structure: "Структура",
    committees: "Комитеттер",
    commissions: "Комиссиялар",
    factions: "Депутаттык фракциялар",
    senateRep: "Федерация Советинде өкүлчүлүк",
    apparatus: "Аппарат",
    brandTop: "ДЭЭДИ ХУРАЛ",
    brandParliament: "(парламент)",
    brandBottom: "ТЫВА РЕСПУБЛИКАНЫН",
    more: "Оон ыңай",
    news: "Медээлер",
    calendar: "Календарь",
    calendarOpen: "Бөлүг-де ачыр",
    prevMonth: "Ылараа ай",
    nextMonth: "Келир ай",
    documents: "Документилер",
    deputies: "Депутаттар",
    appeals: "Кежиглелдер",
    media: "Медиа",
    sessions: "Сессиялар",
    legislation: "Канундар",
    publicEvents: "Көстүглэл‑чогаалдар",
    workWithCitizens: "Кижилер биле ажыл",
    allNews: "Бүткүл медээлер",
    hotNews: "Актуал медээлер",
    search: "Диледир",
    category: "Категория",
    month: "Ай",
    priorities: "Эң-не кол чүүлдер",
    openAllPriorities: "Бүткүл шенилдерни ачыр",
    achievementsTitle: "Регионалдыг чедиишкиннер",
    achievementsMore: "Достокчерилер азыраак",
    region: "Кожуун дугайында",
    government: "Күрүне",
    authorities: "Күрүне органнары",
    docs: "Документилер",
    feedback: "Дилеглерни хүлээп алыры",
    press: "Парлалга албаны",
    activity: "Ажыл-чорудулга",
    contacts: "Харылзажыр улус",
    login: "Кирер чер",
    register: "Регистрация",
    back: "← Хевири",
    otherNews: "Башка чугаалар",
    head: "Башкы",
    deputiesAll: "Депутаттарнын бүткүл созывтары",
    docsLaws: "Тыва Республиканын Канундары",
    docsResolutions: "ВХ РТ постановлениелери",
    docsInitiatives: "Законодательтик инициативалар",
    docsCivic: "Инициатива гражданчылары",
    docsConstitution: "РФ Конституциязынга поправкалар",
    docsBills: "Законопроекттер",
    wifiMap: "Wi‑Fi карта",
    map: "Карта",
    sitemap: "Сайтнын картазы",
    pdPolicy: "ЖСӨ (ПДн) политикчазы",
    license: "Лицензия",
    socials: "Соцсетьтер",
    vk: "ВКонтакте",
    ok: "Одноклассники",
    rutube: "RuTube",
    goHome: "Башкыже",
    socialNetworksHead: "Тыва Республиканың Башкызының Социаль сетьтери",
    subscribe: "Бүгүнүң",
    localSelfGovernment: "Чуртталга",
    legislativeAssembly: "Канун чыыры",
    territorialDepartments: "Территориялыг бөлүктер",
    headsOfBodies: "Органнарның башкылары",
    strategy: "Стратегия",
    plansAndForecasts: "Планнар болгаш прогнозтар",
    resultsAndReports: "Чедиишкиннер болгаш отчеттар",
    announcements: "Медээлер",
    governmentComposition: "Күрүне бүрүзү",
    executiveBodies: "Чорудулга органнары",
    accessibilityVersion: "Көрүр күчүн кызылдары үчүн версия",
    changeLanguage: "Дылды солуур",
    menu: "Меню",
    close: "Дайын",
  },
};

const I18nContext = React.createContext({
  lang: "ru",
  t: (k) => k,
  setLang: () => {},
});
export function useI18n() {
  return React.useContext(I18nContext);
}

export default function I18nProvider({ children }) {
  const [lang, setLang] = React.useState(() => {
    try {
      const saved = localStorage.getItem("site_lang");
      if (saved === "ru" || saved === "ty" || saved === "tyv")
        return saved === "tyv" ? "ty" : saved;
    } catch {}
    const docLang =
      typeof document !== "undefined" ? document.documentElement.lang : "";
    if (docLang === "ty" || docLang === "ru" || docLang === "tyv")
      return docLang === "tyv" ? "ty" : docLang;
    const nav =
      (typeof navigator !== "undefined" && navigator.language) || "ru";
    return nav.startsWith("ty") ? "ty" : "ru";
  });

  // Кэш для переводов через API
  const translationCache = React.useRef(new Map());
  const [apiTranslations, setApiTranslations] = React.useState({});

  React.useEffect(() => {
    try {
      localStorage.setItem("site_lang", lang === "ty" ? "tyv" : lang);
    } catch {}
    if (typeof document !== "undefined") {
      const htmlLang = lang === "ty" ? "tyv" : lang;
      document.documentElement.lang = htmlLang;
      document.documentElement.setAttribute("data-lang", htmlLang);
    }
  }, [lang]);

  // Предзагрузка переводов через API при смене языка
  React.useEffect(() => {
    if (lang === "ty" && dict.ru) {
      // Сначала используем статический словарь для мгновенного отображения
      const staticTranslations = {};
      Object.keys(dict.ru).forEach((key) => {
        staticTranslations[key] = dict.ty && dict.ty[key] ? dict.ty[key] : dict.ru[key];
      });
      setApiTranslations(staticTranslations);
      
      // Затем загружаем переводы через API для обновления
      const loadTranslations = async () => {
        const newTranslations = { ...staticTranslations };
        const keys = Object.keys(dict.ru);
        
        // Загружаем переводы батчами для производительности
        const batchSize = 5;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (key) => {
              const cacheKey = `ru-ty-${dict.ru[key]}`;
              if (translationCache.current.has(cacheKey)) {
                newTranslations[key] = translationCache.current.get(cacheKey);
                return;
              }
              
              try {
                const result = await PublicApi.translate(dict.ru[key], "ru", "ty");
                // Пробуем разные форматы ответа API
                let translated = null;
                
                if (typeof result === 'string') {
                  translated = result;
                } else if (result) {
                  translated = 
                    result?.translated || 
                    result?.text || 
                    result?.result || 
                    result?.translation ||
                    result?.target ||
                    result?.data?.translated ||
                    result?.data?.text ||
                    result?.data?.result ||
                    null;
                }
                
                if (translated && translated !== dict.ru[key] && translated.trim()) {
                  translationCache.current.set(cacheKey, translated);
                  newTranslations[key] = translated;
                }
              } catch (error) {
                // Оставляем статический перевод, не логируем ошибки для каждого ключа
                // console.warn(`Translation error for key ${key}:`, error);
              }
            })
          );
          
          // Обновляем состояние после каждого батча для постепенного обновления
          setApiTranslations({ ...newTranslations });
        }
      };
      
      loadTranslations();
    } else {
      setApiTranslations({});
    }
  }, [lang]);

  const t = React.useCallback(
    (key) => {
      // Если язык тувинский
      if (lang === "ty") {
        // Сначала проверяем переводы через API
        if (apiTranslations[key]) {
          return apiTranslations[key];
        }
        // Затем статический словарь
        if (dict.ty && dict.ty[key]) {
          return dict.ty[key];
        }
        // Fallback на русский
        return dict.ru && dict.ru[key] ? dict.ru[key] : key;
      }
      
      // Для русского языка используем статический словарь
      if (dict[lang] && dict[lang][key]) {
        return dict[lang][key];
      }
      
      // Fallback на русский или ключ
      return dict.ru && dict.ru[key] ? dict.ru[key] : key;
    },
    [lang, apiTranslations]
  );

  const value = React.useMemo(
    () => ({ lang, setLang, t }),
    [lang, t]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
