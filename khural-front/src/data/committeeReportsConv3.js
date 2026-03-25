/**
 * Данные «Отчеты комитетов 3 созыва»: комитеты, повестки и отчёты по годам.
 * Ссылки только на документы (PDF/DOC/DOCX), без ссылок на страницы сайта.
 * Импорт с khural.rtyva.ru/activity/313/, 320/, 362/, 366/ и годовых страниц.
 */

import { CONV3_DOCUMENTS_BY_COMMITTEE_1_7 } from "./conv3_committees_1_7_data.js";

const DOC_BASE = "https://khural.rtyva.ru";

/** Постановление ВХ РТ о комитетах и комиссии третьего созыва (документ) */
export const CONV3_RESOLUTION = {
  title: 'Постановление Верховного Хурала (парламента) Республики Тыва "О комитетах и комиссии Верховного Хурала (парламента) Республики Тыва третьего созыва"',
  size: "12752.3 КБ",
  url: `${DOC_BASE}/upload/iblock/c1b/040dxwcd41ps58ikqnkmyvbuzdx32kdu/постановление%2014.10.2019%20№50%20ПВХ-III.pdf`,
};

/** Список комитетов 3 созыва (порядок как на сайте) */
export const CONV3_COMMITTEES = [
  "Комитет по аграрной политике, земельным имущественным отношениям и экологии",
  "Комитет по безопасности, правопорядку и приграничным вопросам",
  "Комитет по бюджету, налогам, экономике и предпринимательству",
  "Комитет по взаимодействию с федеральными органами власти, органами местного самоуправления, институтами гражданского общества и информационной политике",
  "Комитет по здравоохранению и социальному развитию",
  "Комитет по конституционно-правовой политике и государственному строительству",
  "Комитет по образованию, культуре, молодежной политике и спорту",
  "Комитет по энергетике, строительству, транспорту и жилищно-коммунальному хозяйству",
];

//fdfdf

/**
 * По году и типу (agendas | reports) — массив документов { title, url }.
 * Индекс в массиве = номер комитета (0..7). Данные заполнены для комитета 0 (аграрный).
 */
export const CONV3_DOCUMENTS = {
  agendas: {
    2019: [
      { title: "Повестка заседания комитета 18.12.2019", url: `${DOC_BASE}/upload/iblock/e56/h3yhstm0ifgyla2vill2lrn0bbrs8qgv/Повестка%20заседания%20комитета%2018.12.2019.doc` },
      { title: "Повестка заседания комитета 09.10.2019", url: `${DOC_BASE}/upload/iblock/3d9/p9linwoqbgbh330eot29188toca1i2tm/Повестка%20заседания%20комитета%2009.10.2019.doc` },
      { title: "Повестка заседания комитета 11.11.2019", url: `${DOC_BASE}/upload/iblock/121/5wt7ze7msgxminrmtsud5jf4rsrsmyjg/Повестка%20заседания%20комитета%2011.11.2019.doc` },
      { title: "Повестка заседания комитета 27.09.2019", url: `${DOC_BASE}/upload/iblock/ce6/zyjewaivx6u55h1ruuywxfmj6bokbjhv/Повестка%20заседания%20комитета%2027.09.2019.doc` },
    ],
    2020: [
      { title: "12. Повестка заседания комитета 27.11.2020", url: `${DOC_BASE}/upload/iblock/491/xm21zsagmm2e1tmmnpqr1uxtqqhok31c/12.Повестка%20заседания%20комитета%2027.11.2020.docx` },
      { title: "11. Повестка заседания комитета 16.11.2020", url: `${DOC_BASE}/upload/iblock/488/l7n0yg8pro3zjtyuvwc2nnn2u9igdcmq/11.Повестка%20заседания%20комитета%2016.11.2020.docx` },
      { title: "10. Повестка заседания комитета 11.11.2020", url: `${DOC_BASE}/upload/iblock/ce3/afmlgmjyvzyvopxz5f99414zuj01xmuf/10.Повестка%20заседания%20комитета%2011.11.2020.docx` },
      { title: "9. Повестка заседания комитета 21.10.2020", url: `${DOC_BASE}/upload/iblock/7a3/o0gzgm1c8r7xmka0g0qaxpylir4twzrl/9.Повестка%20заседания%20комитета%2021.10.2020.docx` },
      { title: "8. Повестка заседания комитета 09.12.2020", url: `${DOC_BASE}/upload/iblock/ad5/qgvv6ac0c0nhcfv2c4d2v364a8r7duu4/8.Повестка%20заседания%20комитета%2009.12.2020.docx` },
      { title: "7. Повестка заседания комитета 24.09.2020", url: `${DOC_BASE}/upload/iblock/bfc/1lipxw2cklwo959x19l81hvk6pfhh8ly/7.Повестка%20заседания%20комитета%2024.09.2020.docx` },
      { title: "6. Повестка заседания комитета 11.06.2020", url: `${DOC_BASE}/upload/iblock/65d/rszak6ez3645mswtv7etzft7fh97909b/6.Повестка%20заседания%20комитета%2011.06.2020.docx` },
      { title: "5. Повестка заседания комитета 21.05.2020", url: `${DOC_BASE}/upload/iblock/ad3/vt186by3rqd15mm2kjrqap0a9l6dp0uq/5.Повестка%20заседания%20комитета%2021.05.2020.doc` },
      { title: "4. Повестка заседания комитета 23.04.2020", url: `${DOC_BASE}/upload/iblock/162/g10wc4c5cz9w138s87awty9bkay7ppye/4.Повестка%20заседания%20комитета%2023.04.2020.doc` },
      { title: "3. Повестка заседания комитета 19.03.2020", url: `${DOC_BASE}/upload/iblock/a0c/rglqyh80l6pipt5s8ibl4o9yj2d9k0is/3.Повестка%20заседания%20комитета%2019.03.2020.doc` },
      { title: "2. Повестка заседания комитета 17.02.2020", url: `${DOC_BASE}/upload/iblock/0a9/9gkzxrme0e5gmdzjcvirahhzbyyk3poa/2.Повестка%20заседания%20комитета%2017.02.2020.doc` },
      { title: "1. Повестка заседания комитета 29.01.2020", url: `${DOC_BASE}/upload/iblock/144/xt1xf61wv0yjmyuss9b1c8lebjh30jmk/1.Повестка%20заседания%20комитета%2029.01.2020.doc` },
    ],
    2021: [
      { title: "14. Повестка заседания комитета 25.12.2021 г.", url: `${DOC_BASE}/upload/iblock/be1/siu18d718qwlfkiejy632ozud1nsnz1t/14.Повестка%20заседания%20комитета%2025.12.2021%20г.docx` },
      { title: "13. Повестка заседания комитета 9.12.2021 г.", url: `${DOC_BASE}/upload/iblock/3a1/wq6w21ymsf44fryv140deha1klrti141/13.Повестка%20заседания%20комитета%209.12.2021%20г.docx` },
      { title: "12. Повестка заседания комитета 8.12.2021 г.", url: `${DOC_BASE}/upload/iblock/a6e/6gl6tmoj4px7jz2h4uuspimc52rbeffg/12.Повестка%20заседания%20комитета%208.12.2021%20г.docx` },
      { title: "11. Повестка заседания комитета 19.11.2021 г.", url: `${DOC_BASE}/upload/iblock/e90/vkzj52vsd1btv8xpb4yhsbew4wqfbrv4/11.Повестка%20заседания%20комитета%2019.11.2021%20г..docx` },
      { title: "10. Повестка заседания комитета 19.10.2021 г.", url: `${DOC_BASE}/upload/iblock/8c0/3vaa9k4qzja8qg83oze93nkex6pma89q/10.Повестка%20заседания%20комитета%2019.10.2021%20г..docx` },
      { title: "9. Повестка заседания комитета 09.11.2021 г.", url: `${DOC_BASE}/upload/iblock/5fe/b3slmbm8tsc1x8a3i3e2h3hxgnixfw6p/9.Повестка%20заседания%20комитета%2009.11.2021%20г..docx` },
      { title: "8. Повестка заседания комитета 14.10.2021 г.", url: `${DOC_BASE}/upload/iblock/70b/mt8pi2q2x1w09sxf105hajtwl7uyqljo/8.Повестка%20заседания%20комитета%2014.10.2021%20г..docx` },
      { title: "7. Повестка заседания комитета 23.09.2021 г.", url: `${DOC_BASE}/upload/iblock/301/y01ucmau5mkwlweq2eturww1tlhqf5sk/7.Повестка%20заседания%20комитета%2023.09.2021%20г..docx` },
      { title: "6. Повестка заседания комитета 10.06.2021 г.", url: `${DOC_BASE}/upload/iblock/b17/50z413z43e7hfz1yk1kyv9q1e20ams55/6.Повестка%20заседания%20комитета%2010.06.2021%20г..docx` },
      { title: "5. Повестка заседания комитета 19.05.2021 г.", url: `${DOC_BASE}/upload/iblock/61f/huw1dyog2npw1s5td8uoznb8dod7gzxn/5.Повестка%20заседания%20комитета%2019.05.2021%20г..docx` },
      { title: "4. Повестка заседания комитета 14.04.2021 г.", url: `${DOC_BASE}/upload/iblock/497/gv1h45msk05kv34cgta3l98ni9ajr4hf/4.Повестка%20заседания%20комитета%2014.04.2021%20г..docx` },
      { title: "3. Повестка заседания комитета 19.03.2021 г.", url: `${DOC_BASE}/upload/iblock/267/2kn6knurgmr16q60b0mtgch1ms4h92qd/3.Повестка%20заседания%20комитета%2019.03.2021%20г..docx` },
      { title: "2. Повестка заседания комитета 11.02.2021 г.", url: `${DOC_BASE}/upload/iblock/151/fbuyud71f3yupcfw3mzeld28ikqytdg9/2.Повестка%20заседания%20комитета%2011.02.2021%20г..docx` },
      { title: "1. Повестка заседания комитета 10.02.2021 г.", url: `${DOC_BASE}/upload/iblock/2f9/x6p974qmg6dkytynh4ro5qk2fee9pezh/1.Повестка%20заседания%20комитета%2010.02.2021%20г..docx` },
    ],
    2022: [
      { title: "Повестка заседания комитета 26.12.2022 г.", url: `${DOC_BASE}/upload/iblock/977/ku9pmkpq0irddb0vzzq718qdlerrc8lf/Повестка%20заседания%20комитета%2026.12.2022%20г..docx` },
      { title: "Повестка заседания комитета 8.12.2022 г.", url: `${DOC_BASE}/upload/iblock/216/0dm1ok1s0gquzst85rds75rdpq5blpnr/Повестка%20заседания%20комитета%208.12.2022%20г..docx` },
      { title: "Повестка заседания комитета 28.11.2022 г.", url: `${DOC_BASE}/upload/iblock/99b/s0t76otk0o4u4bmub5jg5f39tgmc81tc/Повестка%20заседания%20комитета%2028.11.2022%20г..docx` },
      { title: "Повестка заседания комитета 17.11.2022 г.", url: `${DOC_BASE}/upload/iblock/182/zqb5tlelx75vrj2kzw132d2c2ockxax6/Повестка%20заседания%20комитета%2017.11.2022%20г..docx` },
      { title: "Повестка заседания комитета 13.10.2022 г.", url: `${DOC_BASE}/upload/iblock/cd8/6f7ml3wdq63zzkekhxlu7208h1m6ele8/Повестка%20заседания%20комитета%2013.10.2022%20г..docx` },
      { title: "Повестка заседания комитета 15.09.2022 г.", url: `${DOC_BASE}/upload/iblock/a9b/9aas6g10en43r95tpklzoa5hohd8guag/Повестка%20заседания%20комитета%2015.09.2022%20г..docx` },
      { title: "Повестка заседания комитета 08.06.2022 г.", url: `${DOC_BASE}/upload/iblock/19d/ffcddinrqmw0wynighism73c1gf5uwiq/Повестка%20заседания%20комитета%2008.06.2022%20г..docx` },
      { title: "Повестка заседания комитета 23.05.2022 г.", url: `${DOC_BASE}/upload/iblock/f13/g8mjnsyluyovdc7rn0w7nef0s243a0p0/Повестка%20заседания%20комитета%20%2023.05.2022%20г..docx` },
      { title: "Повестка заседания комитета 11.04.2022 г.", url: `${DOC_BASE}/upload/iblock/a06/rklcw8dylxsump39hf2ezpx0logoxofz/Повестка%20заседания%20комитета%2011.04.2022%20г..docx` },
      { title: "3. Повестка заседания комитета 10.03.2022 г.", url: `${DOC_BASE}/upload/iblock/16b/m91013tnku0iugt21hrljqlmpn6ucw9l/3.Повестка%20заседания%20комитета%2010.03.2022%20г..docx` },
      { title: "2. Повестка заседания комитета 10.02.2022 г.", url: `${DOC_BASE}/upload/iblock/5d5/fosu1joy0k2yooyseaqu1zc28tsulghz/2.Повестка%20заседания%20комитета%20%2010.02.2022%20г..docx` },
      { title: "1. Повестка заседания комитета 18.01.2022 г.", url: `${DOC_BASE}/upload/iblock/a21/av3fg8unzsa6bnrdhk7u2de91b1atf8u/1.Повестка%20заседания%20комитета%2018.01.2022%20г..docx` },
    ],
    2023: [
      { title: "Повестка агр. ком. 9.02.2023 г.", url: `${DOC_BASE}/upload/iblock/5de/32ggtw8l8glyqfa57n4vau9j6hkxw5vs/Повестка%20%20агр.%20ком.%209.02.2023%20г..docx` },
      { title: "Повестка агр. ком. 13.03.2023 г.", url: `${DOC_BASE}/upload/iblock/e96/crjdvtmq0lj18bromve2ootgvp9bxzny/Повестка%20%20агр.%20ком.%2013.03.2023%20г..docx` },
      { title: "Повестка агр. ком. 13.04.2023 г.", url: `${DOC_BASE}/upload/iblock/8f9/iieeh6lk36hjaci229l0k7ej8bj2o4tk/Повестка%20%20агр.%20ком.%2013.04.2023%20г..docx` },
      { title: "Повестка агр. ком. 15.05.2023 г.", url: `${DOC_BASE}/upload/iblock/b87/ron8achk195ou1h3qihzdbum6pgohxz2/Повестка%20%20агр.%20ком.%2015.05.2023%20г..docx` },
      { title: "Повестка заседания комитета 08.06.2023 г.", url: `${DOC_BASE}/upload/iblock/5ba/x4ublm2klzvdjdpasinpllafp50d3cgz/Повестка%20заседания%20комитета%2008.06.2023%20г..docx` },
      { title: "Повестка заседания комитета 14.09.2023 г.", url: `${DOC_BASE}/upload/iblock/60b/b3dto5icx31u51lixgxxh7wflf85aua3/Повестка%20заседания%20комитета%2014.09.2023%20г..docx` },
    ],
  },
  reports: {
    2019: [
      { title: "Отчет за 2 полугодие 2019 года", url: `${DOC_BASE}/upload/iblock/e81/u7h2skgkv8fc6tt6v6j4sfdrl9qfx7yr/отчет%20агр.%20ком.%20за%20%202%20полугодие%2019%20года.doc` },
    ],
    2020: [
      { title: "Отчет агр. ком. за 2020 год", url: `${DOC_BASE}/upload/iblock/680/gpgdsgg3xf76czx9xx1u4wf3hkf72bac/отчет%20агр.%20ком.%20за%20%202020%20год.doc` },
    ],
    2021: [
      { title: "Отчет агр. ком. за 2021 год", url: `${DOC_BASE}/upload/iblock/b45/h416i6rghtebhxw9k9g1da0k9etykox0/отчет%20агр.%20ком.%20за%202021%20год.doc` },
    ],
    2022: [
      { title: "Отчет агр. ком. за 2022 год", url: `${DOC_BASE}/upload/iblock/d5b/qg4ekyx2g29usdycsh8c0nmmlkkdjasv/отчет%20агр.%20ком.%20за%202022%20год.doc` },
    ],
    2023: [],
  },
};

/** Документы по комитетам 0–7: каждый элемент — { agendas: { 2019..2023 }, reports: { 2019..2023 } }. */
const CONV3_DOCUMENTS_BY_COMMITTEE = [
  { agendas: CONV3_DOCUMENTS.agendas, reports: CONV3_DOCUMENTS.reports },
  ...CONV3_DOCUMENTS_BY_COMMITTEE_1_7,
];

/**
 * Документы по комитету: agendas[year], reports[year] для годов 2019–2023.
 */
export function getConv3DocsByCommittee(committeeIndex) {
  const years = [2019, 2020, 2021, 2022, 2023];
  const data = CONV3_DOCUMENTS_BY_COMMITTEE[committeeIndex];
  if (!data) {
    return {
      agendas: Object.fromEntries(years.map((y) => [y, []])),
      reports: Object.fromEntries(years.map((y) => [y, []])),
    };
  }
  const agendas = {};
  const reports = {};
  years.forEach((y) => {
    agendas[y] = data.agendas[y] || [];
    reports[y] = data.reports[y] || [];
  });
  return { agendas, reports };
}
