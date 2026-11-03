export const INFO_CORRUPTION_SLUG = "info/protivodeystvie-korrupcii";
export const INFO_CORRUPTION_NORMATIVERNIE_SLUG = `${INFO_CORRUPTION_SLUG}/normativnye-akty`;
export const INFO_CORRUPTION_FEDERAL_SLUG = `${INFO_CORRUPTION_NORMATIVERNIE_SLUG}/federalnye-zakony`;
export const INFO_CORRUPTION_PRESIDENTIAL_SLUG = `${INFO_CORRUPTION_NORMATIVERNIE_SLUG}/ukazy-prezidenta`;
export const INFO_CORRUPTION_GOVERNMENT_SLUG = `${INFO_CORRUPTION_NORMATIVERNIE_SLUG}/postanovleniya-pravitelstva`;
export const INFO_CORRUPTION_TYVA_LAWS_SLUG = `${INFO_CORRUPTION_NORMATIVERNIE_SLUG}/zakony-respubliki-tyva`;
export const INFO_CORRUPTION_PLAN_SLUG = `${INFO_CORRUPTION_SLUG}/protivodeystvie-korrupcii-plan`;

const officialPortalUrl = (kind, date, number) => {
  const params = new URLSearchParams({
    searchres: "",
    bpas: "cd00000",
    a3: kind.code,
    a3type: "1",
    a3value: kind.name,
    a6: "",
    a6type: "1",
    a6value: "",
    a15: "",
    a15type: "1",
    a15value: "",
    a7type: "1",
    a7from: "",
    a7to: "",
    a7date: date,
    a8: number,
    a8type: "2",
    a1: "",
    a0: "",
    a16: "",
    a16type: "1",
    a16value: "",
    a17: "",
    a17type: "1",
    a17value: "",
    a4: "",
    a4type: "1",
    a4value: "",
    textpres: "",
    sort: "7",
  });
  return `https://pravo.gov.ru/proxy/ips/?${params.toString()}`;
};

const federalKind = { code: "102000505", name: "Федеральный закон" };
const presidentialKind = { code: "102000503", name: "Указ" };
const governmentKind = { code: "102000496", name: "Постановление" };

const federalActs = [
  ["30.12.2001", "197-ФЗ", "Трудовой кодекс Российской Федерации"],
  ["25.12.2008", "274-ФЗ", "О внесении изменений в отдельные законодательные акты Российской Федерации в связи с принятием Федерального закона «О противодействии коррупции»"],
  ["25.12.2008", "273-ФЗ", "О противодействии коррупции"],
  ["27.07.2004", "79-ФЗ", "О государственной гражданской службе Российской Федерации"],
  ["17.07.2009", "172-ФЗ", "Об антикоррупционной экспертизе нормативных правовых актов и проектов нормативных правовых актов"],
  ["03.12.2012", "230-ФЗ", "О контроле за соответствием расходов лиц, замещающих государственные должности, и иных лиц их доходам"],
  ["21.11.2011", "329-ФЗ", "О внесении изменений в отдельные законодательные акты Российской Федерации в связи с совершенствованием государственного управления в области противодействия коррупции"],
  ["07.05.2013", "79-ФЗ", "О запрете отдельным категориям лиц открывать и иметь счета (вклады), хранить наличные денежные средства и ценности в иностранных банках, расположенных за пределами территории Российской Федерации, владеть и (или) пользоваться иностранными финансовыми инструментами"],
  ["08.03.2006", "40-ФЗ", "О ратификации Конвенции Организации Объединенных Наций против коррупции"],
];

const presidentialActs = [
  ["11.04.2014", "226", "О Национальном плане противодействия коррупции на 2014–2015 годы"],
  ["14.02.2014", "80", "О некоторых вопросах организации деятельности по противодействию коррупции"],
  ["08.07.2013", "613", "Вопросы противодействия коррупции"],
  ["01.07.2010", "821", "О комиссиях по соблюдению требований к служебному поведению федеральных государственных служащих и урегулированию конфликта интересов"],
  ["21.09.2009", "1065", "О проверке достоверности и полноты сведений, представляемых гражданами, претендующими на замещение должностей федеральной государственной службы, и федеральными государственными служащими, и соблюдения федеральными государственными служащими требований к служебному поведению"],
  ["18.05.2009", "559", "О предоставлении гражданами, претендующими на замещение должностей государственной гражданской службы, и федеральными государственными служащими сведений о доходах, об имуществе и обязательствах имущественного характера"],
  ["18.05.2009", "558", "О представлении гражданами, претендующими на замещение государственных должностей Российской Федерации, и лицами, замещающими государственные должности Российской Федерации, сведений о доходах, об имуществе и обязательствах имущественного характера"],
  ["18.05.2009", "560", "О представлении гражданами, претендующими на замещение руководящих должностей в государственных корпорациях, фондах и иных организациях, лицами, замещающими руководящие должности в государственных корпорациях, фондах и иных организациях, сведений о доходах, об имуществе и обязательствах имущественного характера"],
  ["18.05.2009", "557", "Об утверждении перечня должностей федеральной государственной службы, при назначении на которые граждане и при замещении которых федеральные государственные служащие обязаны представлять сведения о своих доходах, об имуществе и обязательствах имущественного характера, а также сведения о доходах, об имуществе и обязательствах имущественного характера своих супруги (супруга) и несовершеннолетних детей"],
  ["12.08.2002", "885", "Об утверждении общих принципов служебного поведения государственных служащих"],
  ["23.06.2014", "460", "Об утверждении формы справки о доходах, расходах, об имуществе и обязательствах имущественного характера и внесении изменений в некоторые акты Президента Российской Федерации"],
];

const governmentActs = [
  ["26.02.2010", "96", "Об антикоррупционной экспертизе нормативных правовых актов и проектов нормативных правовых актов"],
  ["08.09.2010", "700", "О порядке сообщения работодателем о заключении трудового договора с бывшим государственным или муниципальным служащим в течение двух лет после увольнения"],
  ["05.07.2013", "568", "О распространении на отдельные категории граждан ограничений, запретов и обязанностей, установленных Федеральным законом «О противодействии коррупции» и другими федеральными законами"],
  ["09.01.2014", "10", "О порядке сообщения отдельными категориями лиц о получении подарка, его сдачи и оценки, реализации (выкупа) и зачисления вырученных средств"],
];

const tyvaActs = [
  {
    title: 'Закон Республики Тыва от 21.04.2006 № 1739 ВХ-1 «О вопросах государственной гражданской службы Республики Тыва»',
    url: "/documents/corruption/law-1739-vh-1.doc",
  },
  {
    title: 'Закон Республики Тыва от 07.07.2008 № 856 ВХ-2 «О мерах по противодействию коррупции в Республике Тыва»',
    url: "/documents/corruption/law-856-vh-2.doc",
  },
  {
    title: 'Закон Республики Тыва от 18.05.2012 № 1289 ВХ-1 «О внесении изменений в некоторые законодательные акты Республики Тыва в связи с совершенствованием государственного управления в области противодействия коррупции»',
    url: "/documents/corruption/law-1289-vh-1.doc",
  },
  {
    title: 'Закон Республики Тыва от 01.07.2014 № 2613 ВХ-1 «О порядке освобождения от должности лиц, замещающих государственные должности Республики Тыва, в связи с утратой доверия»',
    url: "/documents/corruption/law-2613-vh-1.doc",
  },
];

const federalRows = federalActs.map(([date, number, description]) => ({
  title: `Федеральный закон от ${date} № ${number}`,
  description,
  url: officialPortalUrl(federalKind, date, number),
  external: true,
}));

const presidentialRows = presidentialActs.map(([date, number, description]) => ({
  title: `Указ Президента Российской Федерации от ${date} № ${number}`,
  description,
  url: officialPortalUrl(presidentialKind, date, number),
  external: true,
}));

const governmentRows = governmentActs.map(([date, number, description]) => ({
  title: `Постановление Правительства Российской Федерации от ${date} № ${number}`,
  description,
  url: officialPortalUrl(governmentKind, date, number),
  external: true,
}));

const htmlEscape = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function renderActList(records) {
  return `<div class="corruption-act-list">${records.map((record) => `
    <article class="corruption-act-card">
      <h2>${htmlEscape(record.title)}</h2>
      ${record.description ? `<p>${htmlEscape(record.description)}</p>` : ""}
      <div class="corruption-act-card__actions">
        ${record.external
          ? `<a href="${htmlEscape(record.url)}" target="_blank" rel="noopener noreferrer">Открыть на портале правовой информации</a>`
          : `<a href="${htmlEscape(record.url)}" data-doc-preview data-doc-title="${htmlEscape(record.title)}">Предпросмотр</a><a href="${htmlEscape(record.url)}" download>Скачать DOC</a>`}
      </div>
    </article>`).join("")}</div>`;
}

function renderCategoryLinks() {
  const links = [
    [INFO_CORRUPTION_FEDERAL_SLUG, "Федеральные законы", "9 актов"],
    [INFO_CORRUPTION_PRESIDENTIAL_SLUG, "Указы Президента Российской Федерации", "11 актов"],
    [INFO_CORRUPTION_GOVERNMENT_SLUG, "Постановления Правительства Российской Федерации", "4 акта"],
    [INFO_CORRUPTION_TYVA_LAWS_SLUG, "Законы Республики Тыва", "4 документа"],
    [INFO_CORRUPTION_PLAN_SLUG, "План мероприятий по противодействию коррупции", "2016–2017 годы"],
  ];
  return `<div class="corruption-nav-grid">${links.map(([href, title, meta], index) => `
    <a class="corruption-nav-card" href="/${href}">
      <span class="corruption-nav-card__number">${String(index + 1).padStart(2, "0")}</span>
      <span class="corruption-nav-card__title">${htmlEscape(title)}<small>${htmlEscape(meta)}</small></span>
      <span class="corruption-nav-card__arrow" aria-hidden="true">→</span>
    </a>`).join("")}</div>`;
}

const corruptionPages = {
  [INFO_CORRUPTION_NORMATIVERNIE_SLUG]: {
    title: "Нормативные правовые и иные акты в сфере противодействия коррупции",
    html: `<p>Федеральные и региональные нормативные акты в сфере противодействия коррупции, опубликованные в официальных источниках.</p>${renderCategoryLinks()}`,
  },
  [INFO_CORRUPTION_FEDERAL_SLUG]: {
    title: "Федеральные законы",
    html: renderActList(federalRows),
  },
  [INFO_CORRUPTION_PRESIDENTIAL_SLUG]: {
    title: "Указы Президента Российской Федерации",
    html: renderActList(presidentialRows),
  },
  [INFO_CORRUPTION_GOVERNMENT_SLUG]: {
    title: "Постановления Правительства Российской Федерации",
    html: renderActList(governmentRows),
  },
  [INFO_CORRUPTION_TYVA_LAWS_SLUG]: {
    title: "Законы Республики Тыва",
    html: renderActList(tyvaActs),
  },
  [INFO_CORRUPTION_PLAN_SLUG]: {
    title: "План мероприятий по противодействию коррупции",
    html: `<div class="corruption-act-list">
      <article class="corruption-act-card">
        <h2>Указ Главы Республики Тыва от 25 мая 2016 г. № 61 «О плане противодействия коррупции в Республике Тыва на 2016–2017 годы»</h2>
        <p>Документ опубликован в редакции Указа Главы Республики Тыва от 17.03.2017 № 63.</p>
        <div class="corruption-act-card__actions">
          <a href="${htmlEscape(officialPortalUrl({ code: "102000503", name: "Указ" }, "25.05.2016", "61"))}" target="_blank" rel="noopener noreferrer">Найти акт на портале правовой информации</a>
        </div>
      </article>
    </div>`,
  },
};

export function getCorruptionLocalPage(slug) {
  return corruptionPages[slug] || null;
}

export const CORRUPTION_LOCAL_PAGE_SLUGS = Object.keys(corruptionPages);
