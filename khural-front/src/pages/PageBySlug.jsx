import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import { useAdminData } from "../hooks/useAdminData.js";
import DataState from "../components/DataState.jsx";
import SideNav from "../components/SideNav.jsx";
import { extractPageHtml, extractPageTitle, getPreferredLocaleToken } from "../utils/pages.js";
import { FOR_MEDIA_HTML, FOR_MEDIA_SLUG, FOR_MEDIA_TITLE } from "../content/forMedia.js";

/** Статический контент страницы «Кодекс чести мужчины Тувы» (источник: khural.rtyva.ru). */
const CODE_OF_HONOR_SLUG = "code-of-honor";
export const CODE_OF_HONOR_TITLE = "Кодекс чести мужчины Тувы";
export const CODE_OF_HONOR_HTML = `
<p>Мы, мужчины Республики Тыва,</p>
<ul>
<li>выражая свои интересы и волю;</li>
<li>опираясь на исторические традиции и нравственные принципы предков, передавших нам веру в добро и справедливость;</li>
<li>признавая права и свободу женщин высшей ценностью, придерживаясь общепризнанных принципов развития демократического общества;</li>
<li>сознавая свою ответственность перед нынешним и будущими поколениями за нравственное воспитание мужчин;</li>
<li>руководствуясь тем, что проект Кодекса чести мужчины Тувы был одобрен на кожуунных и сумонных сходах мужчин,</li>
</ul>
<p>принимаем настоящий Кодекс Тувы и провозглашаем его для неукоснительного исполнения:</p>
<ol>
<li>Помни всегда и везде: ты – потомок древнего и благородного народа, а потому не имеешь права на недостойный поступок. Знай и помни свою родословную от основателей рода.</li>
<li>Изучай язык, обычаи, культуру и историю своего народа и края – эти знания укрепят твой дух, возвеличат душу, придадут силы в трудные минуты.</li>
<li>Постоянно работай над своим умственным и физическим развитием. Закаляй и укрепляй здоровье, не поддавайся пагубным пристрастиям, и будь достойным своих великих предков.</li>
<li>Трудись сам, уважай труд и не посягай на чужое добро.</li>
<li>Никогда не завидуй другим. Если ты истинный патриот, докажи это делом и благородным поступком. Будь способным оценить достижения других.</li>
<li>Никогда не оскорбляй ничьих национальных и религиозных чувств, при этом уважай веру своих предков.</li>
<li>Будь гордым и честным, сильным и благородным, готовым прийти на помощь. Береги и защищай младших, уважай и почитай старших, более всего родителей, даровавших тебе жизнь.</li>
<li>Дорожи именем и честью своей семьи, и своего рода, ибо по твоим поступкам и делам будут судить не только о тебе, но и о твоём народе.</li>
<li>Как высшую заповедь предков, усвой истину – величие настоящего мужчины никогда не измерялось богатством, а лишь ответственностью и долгом перед семьей, народом и Отечеством.</li>
</ol>
<hr />
<p><strong>Тыва дылда (на тувинском):</strong></p>
<p>Бистер, Тыва Республиканың эр кижилери, боттарывыстың эрге-ажыктарывысты болгаш күзел-чүткүлдеривисти илеретпишаан;</p>
<ul>
<li>биске чаагай болгаш чөптүг чорукту, бүзүрелди дамчыткан өгбелеривистиң төөгүде езу-чаңчылдарынга болгаш мөзү-шынарының принциптеринге даянмышаан;</li>
<li>херээженнерниң эргелерин болгаш хосталгаларын эң дээди үнелел деп хүлээп көрбүшаан, демократтыг ниитилелди сайзырадырын бүгүдениң хүлээп көрген принциптерин сагывышаан;</li>
<li>амгы болгаш келир салгалдарның мурнунга эр кижилерниң мөзү-шынар кижизидилгези дээш бодувустуң харыысалгавысты медереп билбишаан;</li>
<li>Тывада Эр кижиниң ат-алдарының кодекизиниң төлевилелин кожууннарга болгаш сумуларга эр улус чыыштарынга деткээнин удуртулга болдурбушаан.</li>
</ul>
<p>Тываның бо кодекизин хүлээп ап, ону чайгылыш чок күүседир кылдыр чарлап тур бис:</p>
<ol>
<li>Сен бурунгу чаагай сеткилдиг чоннуң салгалы сен, а ынчангаш төлеп чок чорук кылыр эрге чок дээрзин кажан-даа, каяа-даа утпа. Бодуңнуң төрел салгалыңны билир болгаш сактып чор.</li>
<li>Бодуңнуң чонуңнуң болгаш булуңуңнуң дылын, чаңчылдарын, культуразын болгаш төөгүзүн өөрен, ол билиглер сээң сагыш-сеткилиңни быжыглаар, сүлдеңни бедидер, берге үелерде күштү немээр.</li>
<li>Бодуңнуң угаан-медерелиңни болгаш күш-дамырыңны доктаамал сайзырат. Кадыкшылды дадыктырар болгаш быжыктырар херек, хоралыг чаңчылдарга алыспа, бодуңнуң өндүр улуг өгбелериңге төлептиг бол.</li>
<li>Ажылды бодуң кыл, күш-ажылды хүндүле, өске кижиниң өнчүзүнче хол сукпа.</li>
<li>Өске кижиге кажан-даа адааргава. Бир эвес езулуг кижи болзуңза, ону бодуңнуң ажыл-херээң-биле, чаагай үүлең-биле бадытка. Өскелерниң чедиишкиннерин үнелеп өөрен.</li>
<li>Кымның-даа сөөк-язызын болгаш чүдүлгезин куду көрбе, ооң-биле чергелештир бодуңнуң өгбелериңниң чүдүлгезин хүндүлеп чор.</li>
<li>Чоргаар болгаш шынчы, күштүг болгаш чаагай сеткилдиг, дуза кадарынга кезээде белен бол. Бичиилерни хумагала база камгала, улугларны, ылаңгыя сеңээ амыдыралды чаяаган ада-иеңни, хүндүлеп база дыңнап чор.</li>
<li>Бодуңнуң өг-бүлеңниң, бодуңнуң ызыгуур салгалыңның адын болгаш алдарын сыкпайн чор, сээң ажыл-херээңден чүгле сени эвес, сээң чонуңну база үнелээр апаар.</li>
<li>Өгбелерниң чагыын дээди даңгырак кылдыр хүлээп ап, алыс шынны шиңгээдип ал — эр кижиниң өндүр улуун кажан-даа ооң бай-шыдалдыын эвес, а ооң өг-бүлезиниң, чонунуң болгаш Ада-чуртунуң мурнунга харыысалгазындан үнелеп чораан.</li>
</ol>

`;

/** Статический контент страницы «Свод заповедей матерей Тувы». */
const MOTHERS_COMMANDMENTS_SLUG = "mothers-commandments";
export const MOTHERS_COMMANDMENTS_TITLE = "Свод заповедей матерей Тувы";
export const MOTHERS_COMMANDMENTS_HTML = `
<p>Мы, матери Тувы,</p>
<ul>
<li>осознавая свою священную обязанность по созданию и сохранению семьи, воспитанию детей,</li>
<li>с уверенностью утверждая, что только в согласии отец и мать могут выполнить эту важную миссию, которую поручило им общество,</li>
<li>опираясь на мудрые традиции своих предков,</li>
<li>руководствуясь тем, что проект свода заповедей матерей Тувы был одобрен на кожуунных и сумонных форумах матерей,</li>
</ul>
<p>принимаем настоящие заповеди для исполнения, передачи их от матери к дочери, от старшей к младшей. Эти заповеди призваны с раннего детства учить девочек простому правилу, что из всех житейских дел женщины самым священным является ее долг по отношению к детям и будущему своего рода.</p>
<ol>
<li>Помни: быть матерью – великое счастье, святая обязанность и большая ответственность.</li>
<li>Береги себя смолоду, мысли, чувства и поступки матери имеют могущественное влияние на наследие, которое она передаст детям.</li>
<li>Будь примером для своих детей во всем. От матери зависит, чтобы дети, выйдя из отчего дома, делали добро, а не зло.</li>
<li>Не перекладывай ответственность за воспитание своих детей на родителей, учителей или самих детей.</li>
<li>Содержи свой дом и душу в чистоте.</li>
<li>Делай так, чтобы дом для детей и мужа был тем местом, куда хотелось бы приходить, а не уходить из него.</li>
<li>Знай, что материнская доброта, милосердие и гостеприимность сближают родных и близких семьи.</li>
<li>Будь верной традициям предков. Обучение детей родному языку, обычаям своего народа – долг матери.</li>
<li>Помни, что алкоголь и курение – это зло. Здоровье матери, ее бережное отношение к себе – залог здоровья и счастливого будущего ее детей.</li>
</ol>
<hr />
<p><strong>Тыва дылда (на тувинском):</strong></p>
<p><strong>ТЫВАНЫҢ ИЕЛЕРИНИҢ ЫДЫКТЫГ САГЫЛГАЛАРЫ</strong></p>
<p>Бис, Тываның иелери,</p>
<ul>
<li>өг-бүлени быжыглап тургузар болгаш кадагалаар, ажы-төлдү өстүрүп кижизидер талазы-биле бодувустуң ыдыктыг хүлээлгевисти медереп билбишаан,</li>
<li>чүгле ада болгаш иениң ийи бодунуң эп-чөптүү-биле, ниитилелдиң оларга дагзып кааны чугула хүлээлгени күүседип шыдаар дээрзин бүзүрелдии-биле бадыткавышаан,</li>
<li>өгбелеривистиң мерген угаанныг езу-чаңчылдарынга даянмышаан,</li>
<li>Тываның иелериниң ыдыктыг сагылгаларының чыынды төлевилели кожууннарның болгаш суурларның иелериниң шуулганынга деткимчени алганын барымдаалавышаан,</li>
</ul>
<p>бо ыдыктыг чагыгларны күүседири-биле, авазындан уруунга, улуг назылыглардан биче назылыгларга дамчыдары-биле, хүлээп ап тур бис. Бо ыдыктыг чагыглар херээжен кижиниң амыдырал-чуртталгазында ажыл-херектериниң эң-не ыдыктыы – ооң уругларынга болгаш келир үеде төрел-бөлүүнге хамаарыштыр хүлээлгези деп бөдүүн дүрүмге кыс уругларны бичии чажындан тура өөредирин кыйгырып турар.</p>
<ol>
<li>Мону сактып чор: ие болуру – өндүр улуг аас-кежик, ыдыктыг хүлээлге болгаш улуг харыысалга.</li>
<li>Аныяаңдан бодуңну камна, иениң бодалдары, угаан-медерели болгаш кылган херектери ооң ажы-төлүнге салгал кылдыр дамчыдып турар күчүлүг салдары болур.</li>
<li>Бодуңнуң уруг-дарыыңга бүгү тала-биле үлегер-чижек бол. Уруглар төрээн бажыңындан үнгеш, багай үүлгедиглер эвес, а буянныг херектерни кылыр ужурлуг, ындыг болганда, ол чүгле ие кижиден хамааржыр.</li>
<li>Бодуңнуң ажы-төлүңнүң кижизидилгези дээш харыысалганы ада-иеңче, башкыларже азы уругларның боттарынче чая кагба.</li>
<li>Бажыңыңны база сагыш-сеткилиңни арыг, чараш тудуп чор.</li>
<li>Бажыңыңны уругларыңга болгаш уруг-дарыыңның адазы өөң ээзинге оларның оон чоруксанчыг чери эвес, а эң-не келиксээр болгаш туруксаар чери кылдыр эдилеп чор.</li>
<li>Иениң буянныг чымчаа, эриг баарлыы болгаш экииргек хүндүлээчели өг-бүлениң кады төрээннерин болгаш чоок кижилерин чоокшулаштырып таныштырар дээрзин билип чор.</li>
<li>Өгбелерниң езу-чаңчылдарынга шынчы бол. Бак сөс эдип болбас. Уругларны төрээн дылынга, бодунуң чонунуң чаңчылдарынга өөредири – иениң хүлээлгези.</li>
<li>Арага болгаш таакпы – эң багай, ону сактып чор. Ие кижиниң кадыы, ооң бодунга камныг хамаарылгазы – ооң уругларының кадыының болгаш аас-кежиктиг келир үезиниң үндезини.</li>
</ol>
`;

/** Статический контент страницы «Представительство в Совете Федерации» (источник: khural.rtyva.ru). */
const FEDERATION_COUNCIL_SLUG = "struct/council";
const FEDERATION_COUNCIL_TITLE = "Представительство в Совете Федерации";
const FEDERATION_COUNCIL_HTML = `
<div class="federation-council">
  <div class="federation-council__header">
    <img
      class="federation-council__photo"
      src="https://khural.rtyva.ru/docs/%D0%9A%D1%83%D0%B6%D1%83%D0%B3%D0%B5%D1%82.jfif"
      alt="Кужугет Шолбан Артемович"
      loading="lazy"
    />
    <div class="federation-council__titles">
      <div class="federation-council__title">${FEDERATION_COUNCIL_TITLE}</div>
      <div class="federation-council__name">
        <span>КУЖУГЕТ</span>
        <span>ШОЛБАН</span>
        <span>АРТЕМОВИЧ</span>
      </div>
    </div>
  </div>
  <div class="federation-council__bio">
    <p>Родился 20 февраля 1987 году в г. Чадан Дзун-Хемчикского района в семье рабочих.</p>
    <p>В 2011 году окончил Кемеровскую медицинскую академию по специальности «Лечебное дело».</p>
    <p>Трудовой путь в медицине начал с 2013 года после окончания клинической ординатуры ГБОУ ВПО «Кемеровская государственная медицинская академия» по специальности «хирургия» в должности врача-хирурга ГБУЗ РТ «Республиканская больница № 1». В 2015 году назначен заведующим приемного отделения Республиканской больницы №1, в 2019 году назначен заместителем главного врача по организационно-методической работе. В 2021 году назначен главным врачом ГБУЗ РТ «Республиканская больница № 2», в 2023 году назначен на должность директора Территориального фонда обязательного медицинского страхования.</p>
    <p>Является членом политической партии «Единая Россия».</p>
    <p>Постановлением Верховного Хурала (парламента) Республики Тыва от 21 мая 2025 года наделен полномочиями сенатора Российской Федерации - представителя от Верховного Хурала (парламента) Республики Тыва. Является членом Комитета Совета Федерации по социальной политике.</p>
  </div>
</div>
`;

/** Раздел «Общие сведения» (источник: khural.rtyva.ru). */
const INFO_INDEX_SLUG = "info";
const INFO_INDEX_TITLE = "Общие сведения";
const INFO_INDEX_HTML = `
<div style="display:grid; gap:10px;">
  <p style="margin:0; color:#334155;">Информация, опубликованная в соответствии с требованиями к открытости деятельности государственного органа.</p>
  <div style="display:grid; gap:8px;">
    <a href="/info/finansy">Финансы</a>
    <a href="/info/iokrug">Избирательные округа</a>
    <a href="/info/zakon-karta">Законодательная карта сайта</a>
    <a href="/opendata">Открытые данные</a>
    <a href="/info/upoln-po-prav">Уполномоченный по правам человека</a>
    <a href="/info/upoln-po-reb">Уполномоченный по правам ребенка</a>
    <a href="/info/personnel">Кадровое обеспечение</a>
  </div>
</div>
`;

const INFO_FINANCE_SLUG = "info/finansy";
const INFO_FINANCE_TITLE = "Финансы";
const INFO_FINANCE_HTML = `
<div style="display:grid; gap:10px;">
  <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
    <li><a href="/info/finansy/rezultaty-proverok" style="color: #003366;">Результаты проверок</a></li>
    <li><a href="/info/finansy/goszakupki" style="color: #003366;">Государственные закупки</a></li>
    <li><a href="/info/finansy/otcheti" style="color: #003366;">Отчеты</a></li>
    <li><a href="/info/finansy/byudzhet" style="color: #003366;">Бюджет</a></li>
  </ul>
  <p style="margin:0; line-height:1.7;">
    С 1 января 2011 г. информация о процедурах государственных закупок размещается на едином официальном сайте РФ:
    <a style="color: #003366;  href="http://zakupki.gov.ru/epz/order/extendedsearch/results.html?customerInn=1701009892" target="_blank" rel="noreferrer">zakupki.gov.ru</a>.
  </p>
  <p style="margin:0; line-height:1.7;">
    Информацию по действующим и завершенным процедурам государственных закупок можно получить по телефону 8(39422) 2-32-24.
  </p>
</div>
`;

const INFO_FINANCE_CHECKS_SLUG = "info/finansy/rezultaty-proverok";
const INFO_FINANCE_CHECKS_TITLE = "Результаты проверок";
const INFO_FINANCE_CHECKS_HTML = `
<div style="display:grid; gap:16px;">
  <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
    <li><a href="/info/finansy/rezultaty-proverok/2016">Результаты проверок за 2016 год</a></li>
    <li><a href="/info/finansy/rezultaty-proverok/2018">Результаты проверок за 2018 год</a></li>
    <li><a href="/info/finansy/rezultaty-proverok/2019">Результаты проверок за 2019 год</a></li>
    <li><a href="/info/finansy/rezultaty-proverok/2020">Результаты проверок за 2020 год</a></li>
  </ul>
</div>
`;

const INFO_FINANCE_CHECKS_2016_SLUG = "info/finansy/rezultaty-proverok/2016";
const INFO_FINANCE_CHECKS_2016_TITLE = "Результаты проверок за 2016 год";
const INFO_FINANCE_CHECKS_2016_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; background: #f9fafb;">
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0 0 12px 0;">В 2016 году были проведены 2 проверки: ГУ – региональным отделением Фонда социального страхования РФ по Республике Тыва на основании решения о проведении документальной выездной проверки № 15 от 2 февраля 2016 года и ГУ – управлением пенсионного фонда России по Республике Тыва в г.Кызыле на основании решения о проведении выездной проверки № 018VO2160000002 от 10 февраля 2016 года, проверяемые периоды - 2013-2015 годы.</p>
      <p style="margin:0 0 12px 0;">ГУ – региональным отделением Фонда социального страхования РФ по Республике Тыва по результатам проверки доначислено всего 35934,28 рублей, в том числе начислены пени на сумму 14,77 рублей.</p>
      <p style="margin:0 0 12px 0;">ГУ – управлением пенсионного фонда России по Республике Тыва в г.Кызыле по результатам проверки доначислено всего 28030,94 рублей, в т.ч. начислены пени на общую сумму 3565,01 рублей и штрафных санкций на сумму 4077,65 рублей. Доначисление по страховым взносам составило: по страховой части 16868,02 рублей, по накопительной части 600 рублей и в фонд обязательного медицинского страхования 2920,26 рублей.</p>
      <p style="margin:0;">Все доначисленные по результатам проверок суммы уплачены в установленные сроки во внебюджетные фонды.</p>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_CHECKS_2018_SLUG = "info/finansy/rezultaty-proverok/2018";
const INFO_FINANCE_CHECKS_2018_TITLE = "Результаты проверок за 2018 год";
const INFO_FINANCE_CHECKS_2018_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; background: #f9fafb;">
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0;">В 2019 году проведена проверка целевого и эффективного использования средств республиканского бюджета Республики Тыва, выделенных в 2018 году Верховному Хуралу (парламенту) Республики Тыва. Проверка проведена Счетной палатой Республики Тыва, о чем составлен акт от 15 февраля 2019 года. По результатам проведенной проверки нарушений не выявлено.</p>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_CHECKS_2019_SLUG = "info/finansy/rezultaty-proverok/2019";
const INFO_FINANCE_CHECKS_2019_TITLE = "Результаты проверок за 2019 год";
const INFO_FINANCE_CHECKS_2019_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; background: #f9fafb;">
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0;">В 2020 году проведена проверка целевого и эффективного использования средств республиканского бюджета Республики Тыва, выделенных в 2019 году Верховному Хуралу (парламенту) Республики Тыва. Проверка проведена Счетной палатой Республики Тыва, о чем составлен акт от 2 октября 2020 года. По результатам проведенной проверки нарушений и недостатков не выявлено.</p>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_CHECKS_2020_SLUG = "info/finansy/rezultaty-proverok/2020";
const INFO_FINANCE_CHECKS_2020_TITLE = "Результаты проверок за 2020 год";
const INFO_FINANCE_CHECKS_2020_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; background: #f9fafb;">
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0 0 12px 0;">В 2021 году проведена проверка целевого и эффективного использования средств республиканского бюджета Республики Тыва, выделенных в 2020 году Верховному Хуралу (парламенту) Республики Тыва. Проверка проведена Счетной палатой Республики Тыва, о чем составлен акт от 6 апреля 2021 года. По результатам проведенной проверки нарушений и недостатков не выявлено.</p>
      <p style="margin:0;">На основании решения о проведении выездной проверки от 11.05.2021 г. №22 Регионального отделения Фонда социального страхования Российской Федерации по Республике Тыва проведены выездные проверки по обязательному социальному страхованию от несчастных случаев на производстве и профессиональных заболеваний за период с 01.01.2018 года по 31.12.2020 года, а также по проверке полноты и достоверности представляемых страхователем сведений и документов, необходимых для назначения и выплаты страхового обеспечения за период с 01.07.2018 года по 31.12.2020 года. По результатам проведенных проверок нарушений не установлено, о чем составлены справки от 1 июня 2021 года № 22 и от 1 июня 2021 года № 17002180000352.</p>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_PROCUREMENT_SLUG = "info/finansy/goszakupki";
const INFO_FINANCE_PROCUREMENT_TITLE = "Государственные закупки";
const INFO_FINANCE_PROCUREMENT_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Государственные закупки</h2>
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin:0 0 8px 0; font-weight: 600; color: #111827;">Документы:</p>
      <ul style="margin:0; padding-left: 20px; line-height: 2;">
        <li><a href="https://khural.rtyva.ru/upload/iblock/1f9/%D0%9E%20%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%B2%D0%B0%D1%85%20%D0%B7%D0%B0%D0%BA%D1%83%D0%BF%D0%BE%D0%BA%20%D0%92%D0%A5%20%D0%A0%D0%A2.docx" target="_blank" rel="noreferrer" style="color: #003366;">О нормативах закупок Верховного Хурала (парламента) РТ</a></li>
      </ul>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_SLUG = "info/finansy/otcheti";
const INFO_FINANCE_REPORTS_TITLE = "Отчеты";
const INFO_FINANCE_REPORTS_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчеты об использовании бюджетных средств</h2>
    <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
      <li><a href="/info/finansy/otcheti/2015" style="color: #003366;">Отчет за 2015 год</a></li>
      <li><a href="/info/finansy/otcheti/2016" style="color: #003366;">Отчет за 2016 год</a></li>
      <li><a href="/info/finansy/otcheti/2017" style="color: #003366;">Отчет за 2017 год</a></li>
      <li><a href="/info/finansy/otcheti/2018" style="color: #003366;">Отчет за 2018 год</a></li>
      <li><a href="/info/finansy/otcheti/2019" style="color: #003366;">Отчет за 2019 год</a></li>
      <li><a href="/info/finansy/otcheti/2020" style="color: #003366;">Отчет за 2020 год</a></li>
      <li><a href="/info/finansy/otcheti/2021" style="color: #003366;">Отчет за 2021 год</a></li>
      <li><a href="/info/finansy/otcheti/2022" style="color: #003366;">Отчет за 2022 год</a></li>
      <li><a href="/info/finansy/otcheti/2023" style="color: #003366;">Отчет за 2023 год</a></li>
    </ul>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2015_SLUG = "info/finansy/otcheti/2015";
const INFO_FINANCE_REPORTS_2015_TITLE = "Отчет за 2015 год";
const INFO_FINANCE_REPORTS_2015_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств за 2015 год</h2>
    <p style="margin:0 0 16px 0; color: #6b7280; font-size: 14px;">Приложение 6 к Закону Республики Тыва "Об исполнении республиканского бюджета Республики Тыва за 2015 год"</p>

    <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">ВЕДОМСТВЕННАЯ СТРУКТУРА РАСХОДОВ РЕСПУБЛИКАНСКОГО БЮДЖЕТА РЕСПУБЛИКИ ТЫВА ЗА 2015 ГОД</h3>
    <p style="margin:0 0 16px 0; color: #6b7280; font-size: 13px;">(тыс. рублей)</p>

    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: 600; color: #111827;">Наименование</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Утверждено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Исполнено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">% исполнения</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px;">Функционирование законодательных (представительных) органов государственной власти и представительных органов муниципальных образований</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">93492,9</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">93349,5</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">99,8</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Аппарат Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">71474,9</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">71331,6</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">99,8</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Председатель Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4544,6</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4544,6</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100,0</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Депутаты Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">17473,4</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">17473,3</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100,0</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Фонд оплаты труда государственных (муниципальных) органов и взносы по обязательному социальному страхованию</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">146,1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">146,1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100,0</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2016_SLUG = "info/finansy/otcheti/2016";
const INFO_FINANCE_REPORTS_2016_TITLE = "Отчет за 2016 год";
const INFO_FINANCE_REPORTS_2016_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств за 2016 год</h2>

    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: 600; color: #111827;">Наименование показателя</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: center; font-weight: 600; color: #111827;">Код расхода по бюджетной классификации</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Утверждено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Исполнено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Процент исполнения</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Расходы бюджета - всего, в том числе:</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">х</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">104022,9</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">101266,1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">97,3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Аппарат Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7910000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">78129,2</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">75977,4</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">97,2</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Председатель Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7920000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4644,3</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4457,6</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">96</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Депутаты Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7930000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">19895,3</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">19526,9</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">98</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Фонд оплаты труда государственных (муниципальных) органов и взносы по обязательному социальному страхованию</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7930000110 121</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">13019,7</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">12752</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">98</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2017_SLUG = "info/finansy/otcheti/2017";
const INFO_FINANCE_REPORTS_2017_TITLE = "Отчет за 2017 год";
const INFO_FINANCE_REPORTS_2017_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств за 2017 год</h2>
    <p style="margin:0 0 16px 0; color: #6b7280; font-size: 13px;">(тыс. руб.)</p>

    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: 600; color: #111827;">Наименование показателя</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: center; font-weight: 600; color: #111827;">Код расхода по бюджетной классификации</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Утверждено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Исполнено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Процент исполнения</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Расходы бюджета - всего, в том числе:</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">х</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">101226</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">99419,7</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">98,2</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Аппарат Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7910000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">77037,1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">75269,7</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">97,7</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Председатель Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7920000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4824,1</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">4823</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">99,9</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Депутаты Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900 0103 7930000000 000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">19364,8</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">19327</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">99,8</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2018_SLUG = "info/finansy/otcheti/2018";
const INFO_FINANCE_REPORTS_2018_TITLE = "Отчет за 2018 год";
const INFO_FINANCE_REPORTS_2018_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств за 2018 год</h2>
    <p style="margin:0 0 16px 0; color: #6b7280; font-size: 13px;">(тыс. руб.)</p>

    <div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: left; font-weight: 600; color: #111827;">Наименование показателя</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: center; font-weight: 600; color: #111827;">Код расхода по бюджетной классификации</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Утверждено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Исполнено</th>
            <th style="border: 1px solid #d1d5db; padding: 10px 8px; text-align: right; font-weight: 600; color: #111827;">Процент исполнения</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: 600;">Обеспечение деятельности Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900.0103.7900000</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">107180</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">107180</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Председатель Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900.0103.79200000.111</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">2818,50</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">2818,30</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Депутаты Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900.0103.79200000.112</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">16832,70</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">16832,70</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Аппарат Верховного Хурала (парламента) Республики Тыва</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900.0103.79200000.113</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">55844,00</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">55786,00</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #d1d5db; padding: 8px; padding-left: 16px;">Иные межбюджетные трансферты на обеспечение членов Совета Федерации и их помощников в субъектах РФ</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-family: monospace;">900.0103.9990051420</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">617,20</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">617,10</td>
            <td style="border: 1px solid #d1d5db; padding: 8px; text-align: right;">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2019_SLUG = "info/finansy/otcheti/2019";
const INFO_FINANCE_REPORTS_2019_TITLE = "Отчет за 2019 год";
const INFO_FINANCE_REPORTS_2019_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств за 2019 год</h2>

    <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 24px;">📄</span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="https://khural.rtyva.ru/upload/iblock/178/ix4d70jwylfahx5ibn11bie0yutb17n0/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202019%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
              Отчетность за 2019 год
            </a>

      </div>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2020_SLUG = "info/finansy/otcheti/2020";
const INFO_FINANCE_REPORTS_2020_TITLE = "Отчет за 2020 год";
const INFO_FINANCE_REPORTS_2020_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2020 г.</h2>

    <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 24px;">📄</span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="https://khural.rtyva.ru/upload/iblock/cde/xascukpwi7wd04xxgi9p8znj1np0qoax/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202020%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
              Отчетность за 2020 год
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2021_SLUG = "info/finansy/otcheti/2021";
const INFO_FINANCE_REPORTS_2021_TITLE = "Отчет за 2021 год";
const INFO_FINANCE_REPORTS_2021_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2021 г.</h2>

    <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 24px;">📄</span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="https://khural.rtyva.ru/upload/iblock/443/za4cch1k67p410j47y1fo7do1x8xp8bg/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202021%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
              Отчетность за 2021 год
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2022_SLUG = "info/finansy/otcheti/2022";
const INFO_FINANCE_REPORTS_2022_TITLE = "Отчет за 2022 год";
const INFO_FINANCE_REPORTS_2022_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2022 г.</h2>

    <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 24px;">📄</span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="https://khural.rtyva.ru/upload/iblock/fc5/bzgwyoh85eb6w2igz5utd915zp5lu5k8/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202022%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
              Отчетность за 2022 год
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_FINANCE_REPORTS_2023_SLUG = "info/finansy/otcheti/2023";
const INFO_FINANCE_REPORTS_2023_TITLE = "Отчет за 2023 год";
const INFO_FINANCE_REPORTS_2023_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Отчет об использовании бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2023 г.</h2>

    <div style="margin-top: 20px; padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 24px;">📄</span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="https://khural.rtyva.ru/upload/iblock/1b9/o51ka03fkpt5rsf6ozzgxl55vcvjv9vu/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202023%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
              Отчетность за 2023 год
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_BUDGET_SLUG = "info/finansy/byudzhet";
const INFO_BUDGET_TITLE = "Бюджет";
const INFO_BUDGET_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Бюджет</h2>
    
    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Исполнение республиканского бюджета Республики Тыва</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/finansy/byudzhet/ispolnenie-2015" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2015 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2016" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2016 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2017" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2017 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2018" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2018 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2019" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2019 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2020" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2020 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2021" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2021 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2022" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2022 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2023" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2023 год</a></li>
        <li><a href="/info/finansy/byudzhet/ispolnenie-2024" style="color: #003366;">Исполнение республиканского бюджета Республики Тыва за 2024 год</a></li>
      </ul>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Общая сумма бюджетных средств</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/finansy/byudzhet/summ-2015" style="color: #003366;">Общая сумма бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) РТ за 2015 год</a></li>
        <li><a href="/info/finansy/byudzhet/summ-2016" style="color: #003366;">Общая сумма бюджетных средств, выделенных на функционирование Верховного Хурала (парламента) Республики Тыва за 2016 год</a></li>
      </ul>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Проекты законов о бюджете</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/finansy/byudzhet/proekt-2017" style="color: #003366;">Проект республиканского бюджета на 2017 год и на плановый период 2018 и 2019 годов</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2018" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2018 год и на плановый период 2019 и 2020 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2019" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2019 год и на плановый период 2020 и 2021 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2020" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2020 год и на плановый период 2021 и 2022 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2021" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на плановый период 2021-2023 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2022" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2022 год и на плановый период 2023 и 2024 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2023" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2023 год и на плановый период 2024 и 2025 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2024" style="color: #003366;">Проект закона Республики Тыва "О республиканском бюджете Республики Тыва на 2024 год и на плановый период 2025 и 2026 годов"</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2025" style="color: #003366;">Проект закона Республики Тыва «О республиканском бюджете Республики Тыва на 2025 год и на плановый период 2026 и 2027 годов»</a></li>
        <li><a href="/info/finansy/byudzhet/proekt-2026" style="color: #003366;">Проект закона Республики Тыва «О республиканском бюджете Республики Тыва на 2026 год и на плановый период 2027 и 2028 годов»</a></li>
      </ul>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Отчеты</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/finansy/byudzhet/otchety" style="color: #003366;">Отчеты об исполнении республиканского бюджета Республики Тыва</a></li>
      </ul>
    </div>
  </div>
</div>
`;

const INFO_DISTRICTS_SLUG = "info/iokrug";
const INFO_DISTRICTS_TITLE = "Избирательные округа";
const INFO_DISTRICTS_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Избирательные округа</h2>
    
    <div style="display:grid; gap:12px; margin-top: 20px;">
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/1" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Правобережный одномандатный избирательный округ № 1
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/2" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Западный одномандатный избирательный округ № 2
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/3" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Центральный одномандатный избирательный округ № 3
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/4" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Магистральный одномандатный избирательный округ № 4
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/5" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Первомайский одномандатный избирательный округ № 5
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/6" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Восточный одномандатный избирательный округ № 6
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/7" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Бай-Тайгинский одномандатный избирательный округ № 7
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/8" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Барун-Хемчикский одномандатный избирательный округ № 8
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/9" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Дзун-Хемчикский одномандатный избирательный округ №9
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/10" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Сут-Хольский одномандатный избирательный округ № 10
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/11" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Улуг-Хемский одномандатный избирательный округ № 11
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/12" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Кызылский одномандатный избирательный округ № 12
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/13" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Тандинский одномандатный избирательный округ № 13
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/14" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Пий-Хемский одномандатный избирательный округ № 14
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/15" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Каа-Хемский одномандатный избирательный округ №15
        </a>
      </div>
      
      <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
        <a href="/info/iokrug/16" style="color: #003366; text-decoration: none; font-weight: 600; font-size: 16px;">
          Эрзинский одномандатный избирательный округ №16
        </a>
      </div>
    </div>
  </div>
</div>
`;

const INFO_LAWMAP_SLUG = "info/zakon-karta";
const INFO_LAWMAP_TITLE = "Законодательная карта сайта";
const INFO_LAWMAP_HTML = `
<div style="display:grid; gap:10px; line-height:1.7;">
  <p style="margin:0;">
    Информация о деятельности Верховного Хурала (парламента) Республики Тыва в соответствии со ст.13 Федерального закона РФ № 8‑ФЗ
    «Об обеспечении доступа к информации о деятельности государственных органов и органов местного самоуправления», представленная в виде законодательной карты.
  </p>
  <p style="margin:0;">
  </p>
</div>
`;

const INFO_HISTORY_SLUG = "about/istoriya-parlamentarizma";
const INFO_HISTORY_TITLE = "История парламентаризма в Республике Тыва";
const INFO_HISTORY_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 24px 0; font-size: 28px; font-weight: 700; color: #111827;">История парламентаризма в Республике Тыва</h1>
    
    <div style="line-height: 1.8; color: #374151;">
      <h2 style="margin:24px 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Краткая история законодательного органа Республики Тыва</h2>
      
      <p style="margin:0 0 12px 0;">14 августа 1921 года в селе Суг-Бажы Тандинского кожууна на Всетувинском Учредительном Хурале, созванном представителями 7 кожуунов (районов), была провозглашена Республика Танну-Тува Улус (через пять лет - ТНР). Так открылась новая эра в жизни тувинских аратов – жители Центра Азии впервые в своей долгой истории образовали собственное государство.</p>
      
      <p style="margin:0 0 12px 0;">В октябре 2010 года в республике состоялись выборы депутатов Верховного Хурала (парламента) Республики Тыва первого созыва. С этого момента можно начать отсчет новейшего тувинского парламентаризма.</p>
      
      <h3 style="margin:24px 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">Современный этап</h3>
      
      <p style="margin:0 0 12px 0;">В настоящее время Верховный Хурал (парламент) Республики Тыва - постоянно действующий и единственный законодательный (представительный) орган государственной власти Республики Тыва, который состоит из 32 депутатов. Срок полномочий Верховного Хурала (парламента) Республики Тыва - 5 лет.</p>
      
      <p style="margin:0 0 12px 0;">Верховный Хурал развивает межпарламентские связи, в том числе, международные. С целью совершенствования законотворческого процесса, повышения качества принимаемых нормативных правовых актов, усиления парламентского контроля за исполнением законов, укрепления межпарламентских связей, Верховным Хуралом заключены Договора о взаимодействии и сотрудничестве со следующими законодательными (представительными) органами власти субъектов Российской Федерации: Московской городской Думой, Законодательным Собранием Красноярского края, Законодательными собраниями Ленинградской, Тверской, Кемеровской областей, Государственным Собранием (Эл Курултай) Республики Алтай, Государственным Собранием (Ил Тумэн) Республики Саха (Якутия), Парламентом Чеченской Республики.</p>
      
      <p style="margin:0 0 12px 0;">В декабре 2023 года был подписан аналогичный Договор с новым субъектом России – парламентом Луганской Народной Республики.</p>
      
      <p style="margin:0 0 12px 0;">В июне 2023 года между Верховным Хуралом (парламентом) Республики Тыва (Российская Федерация) и Гомельским областным Советом (Республика Беларусь) подписано Соглашение о сотрудничестве. Налажены сотрудничества с Хуралами гражданских представителей Увс (с 2011 года) и Ховд (с 2023 года) аймаков Монголии.</p>
      
      <p style="margin:0 0 12px 0;">Верховный Хурал в тесной связке работает с Советом Федерации и Государственной Думой Федерального Собрания Российской Федерации, отдельными сенаторами и депутатами.</p>
      
      <div style="margin-top: 32px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #6b7280;">
        <strong>Использованная литература:</strong>
        <ol style="margin:8px 0 0 0; padding-left: 20px;">
          <li>Доржу З.Ю., Ондар Е.М. Российский парламентаризм: региональное измерение (Верховный Хурал Республики Тыва), 2020 г.</li>
          <li>Моллеров Н.М., Натсак О.Д., Самдан А.А. По пути народовластия: представительно-законодательная власть Тувы (предпарламентский период), 2021 г.</li>
          <li>От имени народа, во имя народа. 2018 г.</li>
          <li>История Тувы. Новосибирск, 2007 - Т. 2.</li>
          <li>Регламент Верховного Хурала (парламента) Республики Тыва.</li>
          <li>История ТНР в архивных документах 1921-1944 гг. Новосибирск. Сибирское книжное издательство. 2011. С. 280.</li>
          <li>Ондар Е.М. История становления и развития парламентаризма в Туве. /Кочевые цивилизации народов Центральной и Северной Азии: история, состояние, проблемы. Сборник материалов II Международной научно-практической конференции. Кызыл - Красноярск, 2010. С. 194-197.</li>
        </ol>
      </div>
    </div>
  </div>
</div>
`;

const INFO_POLNOMOCHIYA_SLUG = "about/polnomochiya";
const INFO_POLNOMOCHIYA_TITLE = "Полномочия Верховного Хурала";
const INFO_POLNOMOCHIYA_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 24px 0; font-size: 28px; font-weight: 700; color: #111827;">Полномочия Верховного Хурала</h1>
    
    <div style="line-height: 1.8; color: #374151;">
      <p style="margin:0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827;">К полномочиям Верховного Хурала (парламента) Республики Тыва относятся:</p>
      
      <ol style="margin:0 0 24px 0; padding-left: 20px; line-height: 2;">
        <li>принятие Конституции Республики Тыва и поправок к ней в порядке, установленном Конституцией Республики Тыва;</li>
        <li>принятие конституционных законов Республики Тыва, законов Республики Тыва, внесение в них изменений и дополнений, осуществление контроля за их исполнением;</li>
        <li>назначение выборов Главы – Председателя Правительства Республики Тыва;</li>
        <li>принятие Регламента Верховного Хурала (парламента) Республики Тыва;</li>
        <li>избрание Председателя Верховного Хурала (парламента) Республики Тыва и его заместителя;</li>
        <li>формирование рабочих органов Верховного Хурала (парламента) Республики Тыва;</li>
        <li>заслушивание ежегодных отчетов Главы – Председателя Правительства Республики Тыва о результатах деятельности Правительства Республики Тыва, в том числе по вопросам, поставленным Верховным Хуралом (парламентом) Республики Тыва;</li>
        <li>утверждение по представлению Главы – Председателя Правительства Республики Тыва республиканского бюджета, контроль за его исполнением;</li>
        <li>рассмотрение отчетов Правительства Республики Тыва об исполнении бюджета Республики Тыва;</li>
        <li>определение порядка использования земли и других природных ресурсов республиканского значения, охраны объектов истории, культуры и природы, передачи объектов государственной собственности Республики Тыва в муниципальную;</li>
        <li>образование республиканских фондов, государственного фонда драгоценных металлов и драгоценных камней, утверждение отчетов о расходовании их средств, утверждение бюджетов территориальных государственных внебюджетных фондов Республики Тыва и отчетов об их исполнении;</li>
        <li>утверждение договоров (соглашений), заключаемых от имени Республики Тыва с субъектами Российской Федерации, а также с субъектами иностранных федеративных государств, административно-территориальными образованиями иностранных государств;</li>
        <li>установление порядка управления и распоряжения государственной собственностью Республики Тыва;</li>
        <li>установление республиканских налогов, а также порядка их взимания, определение порядка выпуска республиканских займов и ценных бумаг;</li>
        <li>назначение по представлению Главы – Председателя Правительства Республики Тыва на должность и освобождение от должности Уполномоченного по правам человека в Республике Тыва;</li>
        <li>назначение по представлению Главы – Председателя Правительства Республики Тыва и иных лиц, если это предусмотрено федеральным законом, на должность и освобождение от должности председателя Счетной палаты Республики Тыва, его заместителя и аудиторов Счетной палаты Республики Тыва;</li>
        <li>назначение и прекращение полномочий по представлению Главы – Председателя Правительства Республики Тыва судей Конституционного суда Республики Тыва в порядке, установленном конституционным законом Республики Тыва;</li>
        <li>назначение половины членов Избирательной комиссии Республики Тыва;</li>
        <li>назначение мировых судей в порядке, установленном конституционным законом Республики Тыва;</li>
        <li>принятие решения о недоверии (доверии) Главе – Председателю Правительства Республики Тыва в соответствии с федеральным законом;</li>
        <li>назначение референдума Республики Тыва с согласия Главы – Председателя Правительства Республики Тыва в порядке, установленном законом Республики Тыва;</li>
        <li>назначение выборов депутатов Верховного Хурала (парламента) Республики Тыва;</li>
        <li>учреждение государственных наград Республики Тыва;</li>
        <li>установление дней официальных праздников Республики Тыва;</li>
        <li>рассмотрение информации председателя Верховного суда Республики Тыва, председателя Арбитражного суда Республики Тыва, прокурора Республики Тыва;</li>
        <li>решение других вопросов, отнесенных законодательством Российской Федерации к полномочиям законодательных (представительных) органов государственной власти субъектов Российской Федерации.</li>
      </ol>
      
      <h2 style="margin:24px 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Тексты законов и иных нормативных правовых актов, определяющих полномочия Верховного Хурала (парламента) Республики Тыва</h2>
      
      <h3 style="margin:24px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Конституция Российской Федерации</h3>
      <p style="margin:0 0 12px 0;"><strong>Статья 104</strong></p>
      <p style="margin:0 0 12px 0;">1. Право законодательной инициативы принадлежит Президенту Российской Федерации, Совету Федерации, членам Совета Федерации, депутатам Государственной Думы, Правительству Российской Федерации, законодательным (представительным) органам субъектов Российской Федерации. Право законодательной инициативы принадлежит также Конституционному Суду Российской Федерации и Верховному Суду Российской Федерации по вопросам их ведения.</p>
      
      <h3 style="margin:24px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Федеральный закон от 6 октября 1999 года № 184-ФЗ</h3>
      <p style="margin:0 0 12px 0;">«Об общих принципах организации законодательных (представительных) и исполнительных органов государственной власти субъектов Российской Федерации»</p>
      <p style="margin:0 0 12px 0;"><strong>Статья 5. Основные полномочия законодательного (представительного) органа государственной власти субъекта Российской Федерации</strong></p>
      <p style="margin:0 0 12px 0;">1. Законодательный (представительный) орган государственной власти субъекта Российской Федерации:</p>
      <ul style="margin:0 0 12px 0; padding-left: 20px; line-height: 1.8;">
        <li>а) принимает конституцию субъекта Российской Федерации и поправки к ней, если иное не установлено конституцией субъекта Российской Федерации, принимает устав субъекта Российской Федерации и поправки к нему;</li>
        <li>б) осуществляет законодательное регулирование по предметам ведения субъекта Российской Федерации и предметам совместного ведения Российской Федерации и субъектов Российской Федерации в пределах полномочий субъекта Российской Федерации;</li>
        <li>б2) заслушивает ежегодные отчеты высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации) о результатах деятельности высшего исполнительного органа государственной власти субъекта Российской Федерации, в том числе по вопросам, поставленным законодательным (представительным) органом государственной власти субъекта Российской Федерации;</li>
        <li>в) осуществляет иные полномочия, установленные Конституцией Российской Федерации, настоящим Федеральным законом, другими федеральными законами, конституцией (уставом) и законами субъекта Российской Федерации.</li>
      </ul>
      
      <p style="margin:0 0 12px 0;">2. Законом субъекта Российской Федерации:</p>
      <ul style="margin:0 0 12px 0; padding-left: 20px; line-height: 1.8;">
        <li>а) утверждаются бюджет субъекта Российской Федерации и отчет о его исполнении, представленные высшим должностным лицом субъекта Российской Федерации (руководителем высшего исполнительного органа государственной власти субъекта Российской Федерации);</li>
        <li>в) в пределах полномочий, определенных федеральным законом, устанавливается порядок проведения выборов в органы местного самоуправления на территории субъекта Российской Федерации;</li>
        <li>г) утверждаются программы социально-экономического развития субъекта Российской Федерации, представленные высшим должностным лицом субъекта Российской Федерации (руководителем высшего исполнительного органа государственной власти субъекта Российской Федерации);</li>
        <li>д) устанавливаются налоги и сборы, установление которых отнесено федеральным законом к ведению субъекта Российской Федерации, а также порядок их взимания;</li>
        <li>е) утверждаются бюджеты территориальных государственных внебюджетных фондов субъекта Российской Федерации и отчеты об их исполнении;</li>
        <li>ж) устанавливается порядок управления и распоряжения собственностью субъекта Российской Федерации, в том числе долями (паями, акциями) субъекта Российской Федерации в капиталах хозяйственных обществ, товариществ и предприятий иных организационно-правовых форм;</li>
        <li>з) утверждаются заключение и расторжение договоров субъекта Российской Федерации;</li>
        <li>и) устанавливается порядок назначения и проведения референдума субъекта Российской Федерации;</li>
        <li>к) устанавливается порядок проведения выборов в законодательный (представительный) орган государственной власти субъекта Российской Федерации, порядок проведения выборов высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации) либо порядок избрания высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации) депутатами законодательного (представительного) органа государственной власти субъекта Российской Федерации и порядок отзыва высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации);</li>
        <li>л) устанавливается административно-территориальное устройство субъекта Российской Федерации и порядок его изменения;</li>
        <li>м) устанавливается система исполнительных органов государственной власти субъекта Российской Федерации;</li>
        <li>н) регулируются иные вопросы, относящиеся в соответствии с Конституцией Российской Федерации, федеральными законами, конституцией (уставом) и законами субъекта Российской Федерации к ведению и полномочиям субъекта Российской Федерации.</li>
      </ul>
      
      <p style="margin:0 0 12px 0;">3. Постановлением законодательного (представительного) органа государственной власти субъекта Российской Федерации:</p>
      <ul style="margin:0 0 12px 0; padding-left: 20px; line-height: 1.8;">
        <li>а) принимается регламент указанного органа и решаются вопросы внутреннего распорядка его деятельности;</li>
        <li>б) назначаются на должность и освобождаются от должности отдельные должностные лица субъекта Российской Федерации, оформляется согласие на их назначение на должность, если такой порядок назначения предусмотрен Конституцией Российской Федерации, федеральными законами и конституцией (уставом) субъекта Российской Федерации;</li>
        <li>в) назначаются выборы в законодательный (представительный) орган государственной власти субъекта Российской Федерации, выборы высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации) либо оформляется решение об избрании высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации) депутатами законодательного (представительного) органа государственной власти субъекта Российской Федерации, назначается голосование по отзыву высшего должностного лица субъекта Российской Федерации (руководителя высшего исполнительного органа государственной власти субъекта Российской Федерации);</li>
        <li>г) назначается референдум субъекта Российской Федерации в случаях, предусмотренных законом субъекта Российской Федерации;</li>
        <li>д) оформляется решение о недоверии (доверии) высшему должностному лицу субъекта Российской Федерации (руководителю высшего исполнительного органа государственной власти субъекта Российской Федерации), а также решение о недоверии (доверии) руководителям органов исполнительной власти субъекта Российской Федерации, в назначении которых на должность законодательный (представительный) орган государственной власти субъекта Российской Федерации принимал участие в соответствии с конституцией (уставом) субъекта Российской Федерации;</li>
        <li>е) утверждается соглашение об изменении границ субъектов Российской Федерации;</li>
        <li>ж) одобряется проект договора о разграничении полномочий;</li>
        <li>з) назначаются на должность судьи конституционного (уставного) суда субъекта Российской Федерации;</li>
        <li>и) оформляются иные решения по вопросам, отнесенным Конституцией Российской Федерации, настоящим Федеральным законом, другими федеральными законами, конституцией (уставом) и законами субъекта Российской Федерации к ведению законодательного (представительного) органа государственной власти субъекта Российской Федерации.</li>
      </ul>
      
      <p style="margin:0 0 12px 0;">4. Законодательный (представительный) орган государственной власти субъекта Российской Федерации в пределах и формах, установленных конституцией (уставом) субъекта Российской Федерации и законами субъекта Российской Федерации:</p>
      <ul style="margin:0 0 12px 0; padding-left: 20px; line-height: 1.8;">
        <li>а) осуществляет наряду с другими уполномоченными на то органами контроль за соблюдением и исполнением законов субъекта Российской Федерации, исполнением бюджета субъекта Российской Федерации, исполнением бюджетов территориальных государственных внебюджетных фондов субъекта Российской Федерации, соблюдением установленного порядка распоряжения собственностью субъекта Российской Федерации;</li>
        <li>б) осуществляет иные полномочия, установленные Конституцией Российской Федерации, настоящим Федеральным законом, другими федеральными законами, конституцией (уставом) и законами субъекта Российской Федерации.</li>
      </ul>
      
      <h3 style="margin:24px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Регламент Верховного Хурала (парламента) Республики Тыва</h3>
      <p style="margin:0 0 12px 0;">(утвержден постановлением Верховного Хурала (парламента) Республики Тыва от 29 сентября 2014 года № 1 ПВХ-II)</p>
      <p style="margin:0 0 12px 0;"><strong>Статья 3</strong></p>
      <p style="margin:0 0 12px 0;">1. Полномочия Верховного Хурала определяются федеральным законодательством и Конституцией Республики Тыва.</p>
      <p style="margin:0 0 12px 0;"><strong>Статья 102. Законодательная инициатива Верховного Хурала (парламента) Республики Тыва</strong></p>
      <p style="margin:0 0 12px 0;">Верховный Хурал (парламент) Республики Тыва имеет право законодательной инициативы в Федеральном Собрании Российской Федерации.</p>
      
      <h2 style="margin:24px 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">Учредительные документы</h2>
      
      <div style="margin-top: 16px; display: grid; gap: 12px;">
        <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-size: 24px;">📄</span>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 600; color: #111827;">
                <a href="https://khural.rtyva.ru/docs/%D0%9A%D0%BE%D0%BD%D1%81%D1%82%D0%B8%D1%82%D1%83%D1%86%D0%B8%D1%8F%20%D0%A0%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B8%20%D0%A2%D1%8B%D0%B2%D0%B0.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
                  Конституция Республики Тыва
                </a>
              </div>
             
            </div>
          </div>
        </div>
        
        <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-size: 24px;">📄</span>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 600; color: #111827;">
                <a href="https://khural.rtyva.ru/docs/%D0%A0%D0%B5%D0%B3%D0%BB%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%20%D0%92%D0%A5%20%D0%A0%D0%A2.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
                  Постановление ВХ РТ "О Регламенте Верховного Хурала (парламента) Республики Тыва"
                </a>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_SLUG = "info/personnel";
const INFO_PERSONNEL_TITLE = "Кадровое обеспечение";
const INFO_PERSONNEL_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Кадровое обеспечение</h2>
    
    <div style="margin-top: 20px;">
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/personnel/gosgrazhdanskaya-sluzhba" style="color: #003366; font-weight: 600;">Государственная гражданская служба</a></li>
        <li><a href="/info/personnel/poryadok-postupleniya" style="color: #003366;">Порядок поступления граждан на государственную гражданскую службу</a></li>
        <li><a href="/info/personnel/vakansii" style="color: #003366;">Сведения о вакантных должностях и квалификационные требования</a></li>
        <li><a href="/info/personnel/konkursy" style="color: #003366;">Результаты проведения конкурсов</a></li>
        <li><a href="/info/personnel/telefon-spravok" style="color: #003366;">Телефон для справок по вопросу замещения вакантных должностей</a></li>
        <li><a href="/info/personnel/metodika-konkursa" style="color: #003366;">Методика проведения конкурса на замещение вакантной должности государственной гражданской службы</a></li>
        <li><a href="/info/personnel/poryadok-obzhalovaniya" style="color: #003366;">Порядок обжалования результатов конкурса</a></li>
        <li><a href="/info/personnel/komissii" style="color: #003366;">Комиссии</a></li>
        <li><a href="/info/personnel/dokumenty-pri-postuplenii" style="color: #003366;">Документы необходимые при поступлении на государственную гражданскую службу</a></li>
      </ul>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Документы</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="https://khural.rtyva.ru/info/personnel/443/" target="_blank" rel="noreferrer" style="color: #003366;">Указ Президента Российской Федерации от 10.10.2024 № 870</a></li>
        <li><a href="https://khural.rtyva.ru/info/personnel/444/" target="_blank" rel="noreferrer" style="color: #003366;">Путеводитель по Госслужбе</a></li>
        <li><a href="https://khural.rtyva.ru/info/personnel/285/" target="_blank" rel="noreferrer" style="color: #003366;">Порядок оформления, выдачи и учета удостоверений</a></li>
        <li><a href="https://khural.rtyva.ru/info/personnel/242/" target="_blank" rel="noreferrer" style="color: #003366;">Положение о помощнике депутата Верховного Хурала (парламента) Республики Тыва</a></li>
      </ul>
    </div>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Информация</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/personnel/pensionnoe-obespechenie" style="color: #003366;">Новый порядок пенсионного обеспечения государственных служащих</a></li>
        <li><a href="/info/personnel/otpusk-sluzhaschih" style="color: #003366;">Об уменьшении продолжительности отпуска государственных служащих</a></li>
      </ul>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_GOSLUZHPBA_SLUG = "info/personnel/gosgrazhdanskaya-sluzhba";
const INFO_PERSONNEL_GOSLUZHPBA_TITLE = "Государственная гражданская служба";
const INFO_PERSONNEL_GOSLUZHPBA_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Государственная гражданская служба</h2>
    
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0 0 12px 0;">
        Государственная гражданская служба Республики Тыва - вид государственной службы, представляющей собой профессиональную служебную деятельность граждан Российской Федерации на должностях государственной гражданской службы Республики Тыва по обеспечению исполнения полномочий государственных органов Республики Тыва, лиц, замещающих государственные должности Республики Тыва (включая нахождение в кадровом резерве и другие случаи).
      </p>
      <p style="margin:0 0 12px 0;">
        Государственная гражданская служба Республики Тыва является составной частью государственной гражданской службы Российской Федерации.
      </p>
      <p style="margin:0 0 12px 0;"><strong>Принципами гражданской службы являются:</strong></p>
      <ol style="margin:0 0 12px 0; padding-left: 20px;">
        <li>приоритет прав и свобод человека и гражданина;</li>
        <li>единство правовых и организационных основ федеральной гражданской службы и гражданской службы субъектов Российской Федерации;</li>
        <li>равный доступ граждан, владеющих государственным языком Российской Федерации, к гражданской службе и равные условия ее прохождения независимо от пола, расы, национальности, происхождения, имущественного и должностного положения, места жительства, отношения к религии, убеждений, принадлежности к общественным объединениям, а также от других обстоятельств, не связанных с профессиональными и деловыми качествами гражданского служащего;</li>
        <li>профессионализм и компетентность гражданских служащих;</li>
        <li>стабильность гражданской службы;</li>
        <li>доступность информации о гражданской службе;</li>
        <li>взаимодействие с общественными объединениями и гражданами;</li>
        <li>защищенность гражданских служащих от неправомерного вмешательства в их профессиональную служебную деятельность.</li>
      </ol>
      <p style="margin:0 0 12px 0;"><strong>Регулирование отношений, связанных с гражданской службой, осуществляется:</strong></p>
      <ol style="margin:0; padding-left: 20px;">
        <li>Конституцией Российской Федерации;</li>
        <li>Федеральным законом «О системе государственной службы Российской Федерации» и «О государственной гражданской службе Российской Федерации»;</li>
        <li>другими федеральными законами, в том числе федеральными законами, регулирующими особенности прохождения гражданской службы;</li>
        <li>указами Президента Российской Федерации;</li>
        <li>постановлениями Правительства Российской Федерации;</li>
        <li>нормативными правовыми актами федеральных органов исполнительной власти;</li>
        <li>Конституцией Республики Тыва, Законом Республики Тыва от 21.04.2006 г. № 1739 ВХ-1 «О вопросах государственной гражданской службы Республики Тыва», иными нормативными правовыми актами Республики Тыва.</li>
      </ol>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_PORYADOK_SLUG = "info/personnel/poryadok-postupleniya";
const INFO_PERSONNEL_PORYADOK_TITLE = "Порядок поступления граждан на государственную гражданскую службу";
const INFO_PERSONNEL_PORYADOK_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Порядок поступления граждан на государственную гражданскую службу</h2>
    
    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Нормативные правовые акты</h3>
      <ul style="margin:0; padding-left: 20px; line-height: 2.2;">
        <li><a href="/info/personnel/law-58fz" style="color: #003366;">Федеральный закон № 58-ФЗ от 27.05.2003 г. "О системе государственной службы РФ"</a></li>
        <li><a href="/info/personnel/law-79fz" style="color: #003366;">Федеральный закон № 79-ФЗ от 27.07.2004 г. "О государственной гражданской службе РФ"</a></li>
        <li><a href="/info/personnel/law-112" style="color: #003366;">Указ Президента РФ от 01.02.2005 N 112 "О конкурсе на замещение вакантной должности государственной гражданской службы Российской Федерации"</a></li>
      </ul>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_LAW58FZ_SLUG = "info/personnel/law-58fz";
const INFO_PERSONNEL_LAW58FZ_TITLE = "Федеральный закон № 58-ФЗ от 27.05.2003 г. \"О системе государственной службы РФ\"";
const INFO_PERSONNEL_LAW58FZ_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Федеральный закон № 58-ФЗ от 27.05.2003 г. "О системе государственной службы РФ"</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <p style="margin:0 0 12px 0; font-weight: 600;">РОССИЙСКАЯ ФЕДЕРАЦИЯ</p>
      <p style="margin:0 0 12px 0; font-weight: 600;">ФЕДЕРАЛЬНЫЙ ЗАКОН О СИСТЕМЕ ГОСУДАРСТВЕННОЙ СЛУЖБЫ РОССИЙСКОЙ ФЕДЕРАЦИИ</p>
      <p style="margin:0 0 12px 0;"><strong>Принят</strong> Государственной Думой 25 апреля 2003 года</p>
      <p style="margin:0 0 12px 0;"><strong>Одобрен</strong> Советом Федерации 14 мая 2003 года</p>
      <p style="margin:0 0 12px 0; font-style: italic;">(извлечение)</p>
      
      <h4 style="margin:16px 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">Статья 12. Поступление на государственную службу, ее прохождение и прекращение</h4>
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">На государственную службу по контракту вправе поступать граждане, владеющие государственным языком Российской Федерации и достигшие возраста, установленного федеральным законом о виде государственной службы для прохождения государственной службы данного вида.<br/>Федеральным законом о виде государственной службы или законом субъекта Российской Федерации могут быть установлены дополнительные требования к гражданам при поступлении на государственную службу по контракту.</li>
        <li style="margin:0 0 8px 0;">Условия контрактов, порядок их заключения, а также основания и порядок прекращения их действия устанавливаются в соответствии с федеральным законом о виде государственной службы.</li>
        <li style="margin:0 0 8px 0;">В соответствии с федеральным законом о виде государственной службы контракт может заключаться с гражданином:<ul style="margin:4px 0 0 0; padding-left: 20px;">
          <li>на неопределенный срок;</li>
          <li>на определенный срок;</li>
          <li>на срок обучения в образовательном учреждении профессионального образования и на определенный срок государственной службы после его окончания.</li>
        </ul></li>
        <li style="margin:0 0 8px 0;">Федеральным законом о виде государственной службы определяется предельный возраст пребывания на государственной службе данного вида.</li>
        <li style="margin:0 0 8px 0;">Прохождение государственной службы включает в себя назначение на должность, присвоение классного чина, дипломатического ранга, воинского и специального звания, аттестацию или квалификационный экзамен, а также другие обстоятельства (события) в соответствии с настоящим Федеральным законом, федеральными законами о видах государственной службы и иными нормативными правовыми актами Российской Федерации, законами и иными нормативными правовыми актами субъектов Российской Федерации.</li>
        <li style="margin:0 0 8px 0;">Основания прекращения государственной службы, в том числе основания увольнения в запас или в отставку государственного служащего, устанавливаются федеральными законами о видах государственной службы.</li>
      </ol>
      
      <p style="margin:24px 0 8px 0; font-weight: 600;">Москва, Кремль<br/>27 мая 2003 года<br/>№ 58-ФЗ</p>
      <p style="margin:0; font-weight: 600;">Президент Российской Федерации<br/>В.ПУТИН</p>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_LAW79FZ_SLUG = "info/personnel/law-79fz";
const INFO_PERSONNEL_LAW79FZ_TITLE = "Федеральный закон № 79-ФЗ от 27.07.2004 г. \"О государственной гражданской службе РФ\"";
const INFO_PERSONNEL_LAW79FZ_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Федеральный з����������кон № 79-ФЗ от 27.07.2004 г. "О государственной гражданской службе РФ"</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <p style="margin:0 0 12px 0; font-weight: 600;">РОССИЙСКАЯ ФЕДЕРАЦИЯ</p>
      <p style="margin:0 0 12px 0; font-weight: 600;">ФЕДЕРАЛЬНЫЙ ЗАКОН О ГОСУДАРСТВЕННОЙ ГРАЖДАНСКОЙ СЛУЖБЕ РОССИЙСКОЙ ФЕДЕРАЦИИ</p>
      <p style="margin:0 0 12px 0;"><strong>Принят</strong> Государственной Думой 7 июля 2004 года</p>
      <p style="margin:0 0 12px 0;"><strong>Одобрен</strong> Советом Федерации 15 июля 2004 года</p>
      <p style="margin:0 0 12px 0; font-style: italic;">(извлечение)</p>
      
      <h4 style="margin:16px 0 8px 0; font-size: 15px; font-weight: 600; color: #111827;">Глава 4. ПОСТУПЛЕНИЕ НА ГРАЖДАНСКУЮ СЛУЖБУ</h4>
      
      <h5 style="margin:16px 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Статья 21. Право поступления на гражданскую службу</h5>
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">На гражданскую службу вправе поступать граждане Российской Федерации, достигшие возраста 18 лет, владеющие государственным языком Российской Федерации и соответствующие квалификационным требованиям, установленным настоящим Федеральным законом.</li>
      </ol>
      
      <h5 style="margin:16px 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Статья 22. Поступление на гражданскую службу и замещение должности гражданской службы по конкурсу</h5>
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">Поступление гражданина на гражданскую службу для замещения должности гражданской службы или замещение гражданским служащим другой должности гражданской службы осуществляется по результатам конкурса, если иное не установлено настоящей статьей. Конкурс заключается в оценке профессионального уровня претендентов на замещение должности гражданской службы, их соответствия установленным квалификационным требованиям к должности гражданской службы.</li>
        <li style="margin:0 0 8px 0;">Конкурс не проводится:<ul style="margin:4px 0 0 0; padding-left: 20px;">
          <li>1) при назначении на замещаемые на определенный срок полномочий должности гражданской службы категорий "руководители" и "помощники (советники)";</li>
          <li>2) при назначении на должности гражданской службы категории "руководители", назначение на которые и освобождение от которых осуществляются Президентом Российской Федерации или Правительством Российской Федерации;</li>
          <li>3) при заключении срочного служебного контракта;</li>
          <li>4) при назначении гражданского служащего на иную должность гражданской службы в случаях, предусмотренных частью 2 статьи 28 и частями 1, 2 и 3 статьи 31 настоящего Федерального закона;</li>
          <li>5) при назначении на должность гражданской службы гражданского служащего (гражданина), состоящего в кадровом резерве, сформированном на конкурсной основе.</li>
        </ul></li>
        <li style="margin:0 0 8px 0;">Конкурс может не проводиться при назначении на отдельные должности гражданской службы, исполнение должностных обязанностей по которым связано с использованием сведений, составляющих государственную тайну, по перечню должностей, утверждаемому нормативным актом государственного органа.</li>
        <li style="margin:0 0 8px 0;">По решению представителя нанимателя конкурс может не проводиться при назначении на должности гражданской службы, относящиеся к группе младших должностей гражданской службы.</li>
        <li style="margin:0 0 8px 0;">Претенденту на замещение должности гражданской службы может быть отказано в допуске к участию в конкурсе в связи с несоответствием квалификационным требованиям к вакантной должности гражданской службы, а также в связи с ограничениями, установленными настоящим Федеральным законом для поступления на гражданскую службу и ее прохождения.</li>
        <li style="margin:0 0 8px 0;">Претендент на замещение должности гражданской службы, не допущенный к участию в конкурсе, вправе обжаловать это решение в соответствии с настоящим Федеральным законом.</li>
        <li style="margin:0 0 8px 0;">Для проведения конкурса на замещение вакантной должности гражданской службы правовым актом соответствующего государственного органа образуется конкурсная комиссия.</li>
        <li style="margin:0 0 8px 0;">В состав конкурсной комиссии входят представитель нанимателя и (или) уполномоченные им гражданские служащие (в том числе из подразделения по вопросам государственной службы и кадров, юридического (правового) подразделения и подразделения, в котором проводится конкурс на замещение вакантной должности гражданской службы), представитель соответствующего органа по управлению государственной службой, а также представители научных и образовательных учреждений, других организаций, приглашаемые органом по управлению государственной службой по запросу представителя нанимателя в качестве независимых экспертов - специалистов по вопросам, связанным с гражданской службой, без указания персональных данных экспертов. Число независимых экспертов должно составлять не менее одной четверти от общего числа членов конкурсной комиссии.</li>
        <li style="margin:0 0 8px 0;">Состав конкурсной комиссии для проведения конкурса на замещение вакантной должности гражданской службы, исполнение должностных обязанностей по которой связано с использованием сведений, составляющих государственную тайну, формируется с учетом положений законодательства Российской Федерации о государственной тайне.</li>
        <li style="margin:0 0 8px 0;">Состав конкурсной комиссии формируется таким образом, чтобы была исключена возможность возникновения конфликтов интересов, которые могли бы повлиять на принимаемые конкурсной комиссией решения.</li>
        <li style="margin:0 0 8px 0;">Претендент на замещение должности гражданской службы вправе обжаловать решение конкурсной комиссии в соответствии с настоящим Федеральным законом.</li>
        <li style="margin:0 0 8px 0;">Положение о конкурсе на замещение вакантной должности государственной гражданской службы Российской Федерации, определяющее порядок и условия его проведения, утверждается указом Президента Российской Федерации.</li>
      </ol>
      
      <p style="margin:24px 0 8px 0; font-weight: 600;">Президент Российской Федерации<br/>В.ПУТИН</p>
      <p style="margin:0; font-weight: 600;">Москва, Кремль<br/>27 июля 2004 года<br/>№ 79-ФЗ</p>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_LAW112_SLUG = "info/personnel/law-112";
const INFO_PERSONNEL_LAW112_TITLE = "Указ Президента РФ от 01.02.2005 N 112 \"О конкурсе на замещение вакантной должности государственной гражданской службы Российской Федерации\"";
const INFO_PERSONNEL_LAW112_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Указ Президента РФ от 01.02.2005 N 112</h2>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <p style="margin:0 0 12px 0; font-weight: 600;">УКАЗ ПРЕЗИДЕНТА РОССИЙСКОЙ ФЕДЕРАЦИИ</p>
      <p style="margin:0 0 12px 0; font-weight: 600;">О КОНКУРСЕ НА ЗАМЕЩЕНИЕ ВАКАНТНОЙ ДОЛЖНОСТИ ГОСУДАРСТВЕННОЙ ГРАЖДАНСКОЙ СЛУЖБЫ РОССИЙСКОЙ ФЕДЕРАЦИИ</p>
      <p style="margin:0 0 12px 0; font-style: italic;">(в ред. Указов Президента РФ от 22.01.2011 N 82, от 19.03.2013 N 208, от 19.03.2014 N 156)</p>
      
      <p style="margin:0 0 12px 0;">
        В соответствии с Федеральным законом от 27 июля 2004 г. N 79-ФЗ "О государственной гражданской службе Российской Федерации", в целях обеспечения конституционного права граждан Российской Федерации на равный доступ к государственной службе и права государственных гражданских служащих на должностной рост на конкурсной основе постановляю:
      </p>
      
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">Утвердить прилагаемое Положение о конкурсе на замещение вакантной должности государственной гражданской службы Российской Федерации.</li>
        
        <li style="margin:0 0 8px 0;">Установить на основании части 6 статьи 71 Федерального закона от 27 июля 2004 г. N 79-ФЗ "О государственной гражданской службе Российской Федерации", что до образования федерального государственного органа по управлению государственной службой и государственных органов субъектов Российской Федерации по управлению государственной службой функции этих органов, предусмотренные Положением, утвержденным настоящим Указом, выполняются государственными органами (аппаратами государственных органов), в которых проводится конкурс, в соответствии с законодательством Российской Федерации и законодательством субъектов Российской Федерации.</li>
        
        <li style="margin:0 0 8px 0;">Правительству Российской Федерации:<ul style="margin:4px 0 0 0; padding-left: 20px;">
          <li>утвердить форму анкеты, подлежащей представлению в государственный орган гражданином Российской Федерации, изъявившим желание участвовать в конкурсе на замещение вакантной должности государственной гражданской службы Российской Федерации;</li>
          <li>обеспечить финансирование расходов, связанных с проведением конкурсов на замещение вакантных должностей федеральной государственной гражданской службы, в том числе расходов на оплату труда независимых экспертов, в пределах средств федерального бюджета, предусмотренных на содержание федеральных государственных органов или их аппаратов.</li>
        </ul></li>
        
        <li style="margin:0 0 8px 0;">Установить, что расходы, связанные с проведением конкурсов на замещение вакантных должностей государственной гражданской службы субъектов Российской Федерации, осуществляются в соответствии с законодательством субъектов Российской Федерации.</li>
        
        <li style="margin:0 0 8px 0;">Признать утратившим силу Указ Президента Российской Федерации от 29 апреля 1996 г. N 604 "Об утверждении Положения о проведении конкурса на замещение вакантной государственной должности федеральной государственной службы" (Собрание законодательства Российской Федерации, 1996, N 18, ст. 2115).</li>
        
        <li style="margin:0 0 8px 0;">Настоящий Указ вступает в силу с 1 февраля 2005 г.</li>
      </ol>
      
      <p style="margin:24px 0 8px 0; font-weight: 600;">Президент Российской Федерации<br/>В.ПУТИН</p>
      <p style="margin:0; font-weight: 600;">Москва, Кремль<br/>1 февраля 2005 года<br/>N 112</p>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_TELEFON_SLUG = "info/personnel/telefon-spravok";
const INFO_PERSONNEL_TELEFON_TITLE = "Телефон для справок по вопросу замещения вакантных должностей";
const INFO_PERSONNEL_TELEFON_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Телефон для справок по вопросу замещения вакантных должностей</h2>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <div style="display: grid; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">📍</span>
          <div>
            <div style="font-weight: 600; color: #111827;">Адрес:</div>
            <div style="color: #374151;">г. Кызыл, ул. Ленина 32, Кабинет 116</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">📞</span>
          <div>
            <div style="font-weight: 600; color: #111827;">Телефон:</div>
            <div><a href="tel:839422221229" style="color: #003366; font-size: 18px; font-weight: 600;">8-(39422)-21229</a></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_OBZHALOVANIE_SLUG = "info/personnel/poryadok-obzhalovaniya";
const INFO_PERSONNEL_OBZHALOVANIE_TITLE = "Порядок обжалования результатов конкурса";
const INFO_PERSONNEL_OBZHALOVANIE_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Порядок обжалования результатов конкурса</h2>

    <div style="margin-top: 20px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Подача заявления об оспаривании решения, действия (бездействия) органа государственной власти</h3>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        В соответствии со ст. 254 гл. 25 Гражданского процессуального кодекса Российской Федерации от 14.11.2002 № 138-ФЗ:
      </p>
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">Гражданин, организация вправе оспорить в суде решение, действие (бездействие) органа государственной власти, органа местного самоуправления, должностного лица, государственного или муниципального служащего, если считают, что нарушены их права и свободы. Гражданин, организация вправе обратиться непосредственно в суд или в вышестоящий в порядке подчиненности орган государственной власти, орган местного самоуправления, к должностному лицу, государственному или муниципальному служащему.</li>
        <li style="margin:0 0 8px 0;">Заявление подается в суд по подсудности, установленной статьями 24 - 27 настоящего Кодекса. Заявление может быть подано гражданином в суд по месту его жительства или по месту нахождения органа государственной власти, органа местного самоуправления, должностного лица, государственного или муниципального служащего, решение, действие (бездействие) которых оспариваются.</li>
        <li style="margin:0 0 8px 0;">Заявление военнослужащего, оспаривающего решение, действие (бездействие) органа военного управления или командира (начальника) воинской части, подается в военный суд.</li>
        <li style="margin:0 0 8px 0;">Суд вправе приостановить действие оспариваемого решения до вступления в законную силу решения суда.</li>
      </ol>
    </div>

    <div style="margin-top: 24px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Рассмотрение индивидуальных служебных споров</h3>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        В соответствии со ст. 69 и ст. 70 Федерального закона от 27.07.2004 № 79-ФЗ "О государственной гражданской службе Российской Федерации":
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        <strong>Индивидуальный служебный спор</strong> - неурегулированные между представителем нанимателя и гражданским служащим либо гражданином, поступающим на гражданскую службу или ранее состоявшим на гражданской службе, разногласия по вопросам применения законов, иных нормативных правовых актов о гражданской службе и служебного контракта, о которых заявлено в орган по рассмотрению индивидуальных служебных споров.
      </p>
      <ol style="margin:0; padding-left: 20px; line-height: 1.8;">
        <li style="margin:0 0 8px 0;">Индивидуальные служебные споры рассматриваются следующими органами:<ul style="margin:4px 0 0 0; padding-left: 20px;">
          <li>комиссией государственного органа по служебным спорам;</li>
          <li>судом.</li>
        </ul></li>
        <li style="margin:0 0 8px 0;">Порядок рассмотрения служебных споров в органах по рассмотрению служебных споров регулируется настоящим Федеральным законом и другими федеральными законами, а порядок рассмотрения дел по служебным спорам в судах определяется также гражданским процессуальным законодательством Российской Федерации.</li>
        <li style="margin:0 0 8px 0;">Комиссия государственного органа по служебным спорам образуется решением представителя нанимателя из равного числа представителей выборного профсоюзного органа данного государственного органа и представителя нанимателя.</li>
        <li style="margin:0 0 8px 0;">Представители выборного профсоюзного органа данного государственного органа избираются в комиссию по служебным спорам на конференции гражданских служащих государственного органа. Представители представителя нанимателя назначаются в комиссию по служебным спорам представителем нанимателя.</li>
        <li style="margin:0 0 8px 0;">Комиссия по служебным спорам имеет свою печать. Организационное и техническое обеспечение деятельности комиссии по служебным спорам осуществляется государственным органом.</li>
        <li style="margin:0 0 8px 0;">Комиссия по служебным спорам избирает из своего состава председателя и секретаря комиссии.</li>
        <li style="margin:0 0 8px 0;">Служебный спор рассматривается комиссией по служебным спорам в случае, если гражданский служащий самостоятельно или с участием своего представителя не урегулировал разногласия при непосредственных переговорах с представителем нанимателя.</li>
        <li style="margin:0 0 8px 0;">Гражданский служащий либо гражданин, поступающий на гражданскую службу или ранее состоявший на гражданской службе, может обратиться в комиссию по служебным спорам в трехмесячный срок со дня, когда он узнал или должен был узнать о нарушении своего права.</li>
        <li style="margin:0 0 8px 0;">В случае пропуска по уважительным причинам срока, комиссия по служебным спорам может восстановить этот срок и рассмотреть служебный спор по существу.</li>
        <li style="margin:0 0 8px 0;">Комиссия по служебным спорам обязана рассмотреть служебный спор в течение десяти календарных дней со дня подачи письменного заявления.</li>
        <li style="margin:0 0 8px 0;">Решение комиссии по служебным спорам может быть обжаловано любой из сторон в суд в десятидневный срок со дня вручения ей копии решения комиссии.</li>
        <li style="margin:0 0 8px 0;">В судах рассматриваются служебные споры по письменным заявлениям гражданского служащего либо гражданина, поступающего на гражданскую службу или ранее состоявшего на гражданской службе, представителя нанимателя или представителя выборного профсоюзного органа данного государственного органа, если хотя бы один из них не согласен с решением комиссии по служебным спорам либо если гражданский служащий или представитель нанимателя обращается в суд без обращения в комиссию по служебным спорам.</li>
      </ol>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_PENSION_SLUG = "info/personnel/pensionnoe-obespechenie";
const INFO_PERSONNEL_PENSION_TITLE = "Новый порядок пенсионного обеспечения государственных служащих";
const INFO_PERSONNEL_PENSION_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Новый порядок пенсионного обеспечения государственных служащих</h2>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Президент Российской Федерации Владимир Путин подписал Федеральный закон № 143-ФЗ «О внесении изменений в отдельные законодательные акты Российской Федерации в части увеличения пенсионного возраста отдельным категориям граждан» от 23 мая 2016 года.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Согласно справке Государственно-правового управления Федеральным законом устанавливаются новые порядок и условия пенсионного обеспечения лиц, замещающих государственные должности Российской Федерации, государственные должности субъектов Российской Федерации, должности государственной гражданской службы Российской Федерации и должности муниципальной службы.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        В Федеральный закон «О страховых пенсиях» вносятся изменения, согласно которым увеличивается общеустановленный возраст для назначения пенсии по старости лицам, замещающим государственные должности Российской Федерации, государственные должности субъектов Российской Федерации, должности государственной гражданской службы Российской Федерации и должности муниципальной службы: мужчинам – на пять лет (до 65 лет), женщинам – на восемь лет (до 63 лет). При этом устанавливается, что такое повышение будет осуществляться постепенно, на шесть месяцев в год.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Наряду с увеличением возраста для назначения пенсии по старости Федеральным законом увеличивается с 15 до 20 лет (поэтапно до 2026 года) стаж, необходимый для назначения федеральным государственным гражданским служащим пенсии за выслугу лет, в связи с чем вносятся изменения в Федеральный закон «О государственном пенсионном обеспечении в Российской Федерации».
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Учитывая положения Федерального закона «О государственной гражданской службе Российской Федерации» (статьи 6 и 7) о соотносительности основных условий государственного пенсионного обеспечения граждан, проходивших государственную службу Российской Федерации, и граждан, проходивших муниципальную службу, предусмотренные Федеральным законом новые требования к условиям назначения пенсии по старости и пенсии за выслугу лет, которые устанавливаются для федеральных государственных гражданских служащих, распространяются на порядок и условия назначения пенсий государственным гражданским служащим субъектов Российской Федерации и муниципальным служащим.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        За субъектами Российской Федерации и органами местного самоуправления сохраняется право определять иные условия пенсионного обеспечения (размеры пенсий или доплат к ним, периоды работы или службы, включаемые в соответствующий стаж, и другие), которое устанавливается лицам, замещавшим должности государственной гражданской службы субъектов Российской Федерации и должности муниципальной службы, за счёт средств бюджетов субъектов Российской Федерации или местных бюджетов.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Новые требования к минимальному стажу, необходимому для назначения пенсии за выслугу лет, предусмотренной Федеральным законом «О государственном пенсионном обеспечении в Российской Федерации», не будут распространяться на лиц, приобретших право на эту пенсию и уволенных с федеральной государственной гражданской службы, на лиц, замещающих на дату вступления в силу Федерального закона должности федеральной государственной гражданской службы и имеющих стаж государственной гражданской службы для назначения пенсии не менее 20 лет, а также на лиц, замещающих на дату вступления Федерального закона в силу должности федеральной государственной гражданской службы и являющихся пенсионерами.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        В настоящее время в соответствии с Федеральным законом «О статусе члена Совета Федерации и статусе депутата Государственной Думы Федерального Собрания Российской Федерации» право на ежемесячную доплату к страховой пенсии по старости (инвалидности) имеют лица, исполнявшие полномочия члена Совета Федерации или депутата Государственной Думы не менее одного года. Согласно новому порядку право на названную доплату приобретут члены Совета Федерации или депутаты Государственной Думы, исполнявшие свои полномочия в течение пяти лет, что соотносится со сроком исполнения полномочий депутата Государственной Думы одного созыва. Размер доплаты будет зависеть от продолжительности исполнения таких полномочий. Новый порядок не коснется членов Совета Федерации и депутатов Государственной Думы, приобретших на дату вступления в силу Федерального закона право на назначение пенсии по старости (инвалидности) и право на установление ежемесячной доплаты к пенсии.
      </p>
      <p style="margin:16px 0 0 0; font-style: italic; color: #6b7280;">
        Источник: "Федеральный портал государственной службы и управленческих кадров"
      </p>
    </div>
  </div>
</div>
`;

const INFO_PERSONNEL_OTPUSK_SLUG = "info/personnel/otpusk-sluzhaschih";
const INFO_PERSONNEL_OTPUSK_TITLE = "Об уменьшении продолжительности отпуска государственных служащих";
const INFO_PERSONNEL_OTPUSK_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Об уменьшении продолжительности отпуска государственных служащих</h2>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; line-height: 1.7;">
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Подписан закон об уменьшении продолжительности отпуска государственных служащих.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Президент Российской Федерации Владимир Путин подписал Федеральный закон № 176-ФЗ от 2 июня 2016 года «О внесении изменений в статьи 45 и 46 Федерального закона «О государственной гражданской службе Российской Федерации» в части упорядочения продолжительности отпусков на государственной гражданской службе».
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Согласно Справке Государственно-правового управления Федеральным законом предусматривается уменьшение продолжительности ежегодного основного оплачиваемого отпуска государственных гражданских служащих, замещающих должности государственной гражданской службы высшей и главной групп, с 35 до 30 календарных дней.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Изменяется порядок исчисления продолжительности ежегодного дополнительного оплачиваемого отпуска за выслугу лет для всех государственных гражданских служащих. Вместо исчисления этой части отпуска из расчёта один календарный день за каждый год государственной гражданской службы Федеральным законом вводится новый порядок поэтапного увеличения этого отпуска в зависимости от стажа. При этом указанный отпуск максимальной продолжительностью 10 календарных дней предоставляется при стаже государственной гражданской службы 15 лет и более.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Также изменяется уровень регулирования вопроса о продолжительности предоставляемого государственным гражданским служащим ежегодного дополнительного оплачиваемого отпуска за ненормированный служебный день. Продолжительность этого отпуска определяется не коллективным договором или служебным распорядком государственного органа, а непосредственно Федеральным законом «О государственной гражданской службе Российской Федерации» и составляет три календарных дня.
      </p>
      <p style="margin:16px 0 0 0; font-style: italic; color: #6b7280;">
        Источник: "Федеральный портал государственной службы и управленческих кадров"
      </p>
    </div>
  </div>
</div>
`;

const OPENDATA_SLUG = "opendata";
const OPENDATA_TITLE = "Открытые данные";
const OPENDATA_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <h2 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700;">Открытые данные</h2>
    
    <div style="line-height: 1.7; margin-bottom: 24px;">
      <p style="margin:0 0 12px 0;">
        В этом разделе представлена информация о деятельности Верховного Хурала (парламента) Республики Тыва, размещаемая в сети «Интернет» в форме открытых данных.
      </p>
      <p style="margin:12px 0 0 0; line-height: 1.7;">
        Размещение государственными органами и органами местного самоуправления информации о своей деятельности в сети «Интернет» в форме открытых данных - это форма, при которой такая информация размещается в сети «Интернет» в виде массивов данных, организованных в формате, обеспечивающем их автоматическую обработку в целях повторного использования без предварительного изменения человеком (машиночитаемый формат), и на условиях ее свободного использования.
      </p>
      <p style="margin:12px 0 0 0; line-height: 1.7;">
        Предложения и отзывы по наборам открытых данных вы можете оставить через <a href="/appeals" style="color: #003366; text-decoration: underline;">форму обратной связи</a>.
      </p>
    </div>

    <div style="margin-top: 24px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Характеристика набора данных</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="border: 1px solid #dfe3eb; padding: 10px; text-align: left; font-weight: 600; color: #111827;">№</th>
            <th style="border: 1px solid #dfe3eb; padding: 10px; text-align: left; font-weight: 600; color: #111827;">Характеристика</th>
            <th style="border: 1px solid #dfe3eb; padding: 10px; text-align: left; font-weight: 600; color: #111827;">Описание</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">1</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Идентификационный номер (код) актуального набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">1701009892-maininfo</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">2</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Наименование набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Общая информация о Верховном Хурале (парламенте) Республики Тыва</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">3</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Описание набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Информация о Верховном Хурале (парламенте) Республики Тыва, его почтовый адрес, адрес электронной почты, номера телефонов</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">4</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Владелец набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Верховный Хурал (парламент) Республики Тыва</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">5</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Ответственное лицо</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Хертек Санчаа Саянович - заместитель начальника отдела</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">6</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Телефон ответственного лица</td><td style="border: 1px solid #dfe3eb; padding: 8px;">(394-22) 2-32-27</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">7</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Адрес электронной почты ответственного лица</td><td style="border: 1px solid #dfe3eb; padding: 8px;"><a href="mailto:sanchaa.xertek@mail.ru" style="color: #003366;">sanchaa.xertek@mail.ru</a></td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">8</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Гиперссылка (URL) на набор</td><td style="border: 1px solid #dfe3eb; padding: 8px;">1701009892-data-structure</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">9</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Формат данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">csv</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">10</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Описание структуры набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">1701009892-structure-20170309</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">11</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Дата первой публикации набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">09.03.2017</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">12</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Дата последнего внесения изменений</td><td style="border: 1px solid #dfe3eb; padding: 8px;">09.03.2017</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">13</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Содержание последнего изменения</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Первичная публикация</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">14</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Периодичность актуализации набора данных</td><td style="border: 1px solid #dfe3eb; padding: 8px;">По мере изменения</td></tr>
          <tr><td style="border: 1px solid #dfe3eb; padding: 8px;">15</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Ключевые слова</td><td style="border: 1px solid #dfe3eb; padding: 8px;">Общая информация о Верховном Хурале (парламенте) Республики Тыва</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
      <strong style="color: #111827;">Файловое представление:</strong>
      <div style="margin-top: 8px;">
        <a href="https://khural.rtyva.ru/upload/iblock/opendata/1701009892-maininfo.csv" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
          1701009892-maininfo.csv
        </a>
      </div>
    </div>

    <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin:0 0 12px 0; font-size: 16px; font-weight: 600; color: #111827;">Условия использования набора данных:</h3>
      <p style="margin:0 0 12px 0; line-height: 1.7;">
        Пользователь без заключения договора может использовать (в том числе повторно) открытые данные свободно, бесплатно, бессрочно, безвозмездно и без ограничения территории использования, в том числе имеет право копировать, публиковать, распространять открытые данные, видоизменять открытые данные и объединять их с другой информацией, использовать открытые данные в некоммерческих и коммерческих целях, использовать для создания программ для ЭВМ и приложений.
      </p>
      <p style="margin:0 0 12px 0; line-height: 1.7;"><strong>При использовании открытых данных Пользователь обязан:</strong></p>
      <ul style="margin:0 0 12px 0; padding-left: 20px; line-height: 1.7;">
        <li>Использовать открытые данные только в законных целях;</li>
        <li>Не искажать открытые данные при их использовании;</li>
        <li>Сохранять ссылку на источник информации при использовании открытых данных.</li>
      </ul>
      <p style="margin:0; line-height: 1.7;">
        При несоблюдении пользователем условий соглашения права, предоставленные пользователю в соответствии с соглашением, автоматически прекращаются.
      </p>
    </div>
  </div>
</div>
`;

const INFO_OMBUDSMAN_HUMAN_SLUG = "info/upoln-po-prav";
const INFO_OMBUDSMAN_HUMAN_TITLE = "Уполномоченный по правам человека в Республике Тыва";
const INFO_OMBUDSMAN_HUMAN_HTML = `
<div class="ombudsman-page">
  <div class="ombudsman-page__header">
    <img
      class="ombudsman-page__photo"
      src="https://khural.rtyva.ru/images/%D0%B0%D0%B4%D1%8B%D0%B3%D0%B1%D0%B0%D0%B9.jpg"
      alt="Адыгбай Александр Мижит-оолович"
      loading="lazy"
    />
    <div class="ombudsman-page__titles">
      <div class="ombudsman-page__title">Уполномоченный по правам человека в Республике Тыва</div>
      <div class="ombudsman-page__name">Адыгбай Александр Мижит-оолович</div>
      <div class="ombudsman-page__subtitle">
        Действительный государственный советник Республики Тыва 3 класса.
      </div>
    </div>
  </div>

  <div class="ombudsman-page__content">
    <p>
      Адыгбай Александр Мижит-оолович, родился 01 октября 1962 года в с. Бай-Хаак Тандинского района Тувинской АССР.
    </p>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Образование</div>
      <ul>
        <li>1980 - 1985 г. Томский государственный университет</li>
      </ul>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Трудовая деятельность</div>
      <ul>
        <li>1985 – 2003 г. служба в органах прокуратуры Тувинской АССР, Томской и Новосибирской области</li>
        <li>2003 - 2004 г. заместитель руководителя Межрегионального территориального органа в Сибирском федеральном округе федеральной службы РФ по финансовому оздоровлению и банкротству</li>
        <li>2004 г. начальник службы экономического развития в ЗАО группа «Февраль»</li>
        <li>2005 – 2006 г. директор Новосибирского филиала некоммерческого партнерства «Сибирская межрегиональная саморегулируемая организация арбитражных управляющих»</li>
        <li>2007 г. начальник отдела юридического и кадрового обеспечения управления Росприроднадзора по Новосибирской области Федеральной службы по надзору в сфере природопользования РФ</li>
        <li>2007 – 2009 г. заместитель руководителя аппарата Правительства Республики Тыва - начальник управления правовой экспертизы и систематизации законодательства</li>
        <li>2009 – 2017 г. руководитель управления Росприроднадзора по Республике Тыва Федеральной службы по надзору в сфере природопользования РФ</li>
        <li>2017 – 2021 гг. депутат Верховного Хурала (парламента) Республики Тыва</li>
        <li>С 2023 года – Уполномоченный по правам человека в Республике Тыва</li>
      </ul>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Контакты и адреса</div>
      <ul style="margin:0; padding-left: 20px;">
        <li>Телефон: <a href="tel:+73942226308" style="color: #003366;">+7(394-22)-2-63-08</a></li>
        <li>Адрес: 667010, Республика Тыва, г. Кызыл, ул. Красноармейская д.100, каб. 402</li>
        <li>E-mail: <a href="mailto:ombudsman@rtyva.ru" style="color: #003366;">ombudsman@rtyva.ru</a></li>
      </ul>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Документы</div>
      <ul style="margin:0; padding-left: 20px;">
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A7%20%D0%B7%D0%B0%202022%20%D0%B3..pdf" target="_blank" rel="noreferrer" style="color: #003366;">Доклад Уполномоченного по правам человека в Республике Тыва за 2022 год (PDF)</a></li>
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%B7%D0%B0%202021%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366;">����������оклад Уполномоченного по правам человека в Республике Тыва за 2021 год (DOCX)</a></li>
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%90%D0%B4%D1%8B%D0%B3%D0%B1%D0%B0%D0%B9%20%D0%90.%D0%9C.%20%D0%B7%D0%B0%202024%20%D0%B3%D0%BE%D0%B4.pdf" target="_blank" rel="noreferrer" style="color: #003366;">Доклад Уполномоченного по правам человека в Республике Тыва за 2024 год (PDF)</a></li>
      </ul>
    </div>
  </div>
</div>
`;

const INFO_OMBUDSMAN_CHILD_SLUG = "info/upoln-po-reb";
const INFO_OMBUDSMAN_CHILD_TITLE = "Уполномоченный по правам ребенка в Республике Тыва";
const INFO_OMBUDSMAN_CHILD_HTML = `
<div style="display:grid; gap:10px; line-height:1.7;">
  <div style="display:grid; gap:4px;">
    <div style="font-weight:900;">Сенгии Саида Хертековна</div>
    <div style="opacity:.85;">Назначена 27 марта 2024 года постановлением Верховного Хурала (Парламента).</div>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Контакты</div>
    <div>Адрес: 667010, Республика Тыва, г. Кызыл, ул. Калинина д.1б</div>
    <div>Телефон: <a href="tel:83942226309">8 (394-22) 2-63-09</a></div>
    <div>Факс: 8 (39422) 26308</div>
    <div>E-mail: <a href="mailto:saidasengii@mail.ru">saidasengii@mail.ru</a></div>
    <div>E-mail: <a href="mailto:tyvarfdeti@rtyva.ru">tyvarfdeti@rtyva.ru</a></div>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Биография</div>
    <div>Родилась 17 мая 1970 года в г. Кызыле.</div>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Образование</div>
    <ul style="margin:0; padding-left: 20px;">
      <li>1993 г. – Кызылский государственный педагогический институт</li>
      <li>2007 г. – Сибирский юридический институт МВД России</li>
    </ul>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Награды</div>
    <ul style="margin:0; padding-left: 20px;">
      <li>2007 г. – медаль Республики Тыва «За доблестный труд»</li>
      <li>2021 г. – юбилейная медаль в честь 100-летия образования Тувинской Народной Республики</li>
    </ul>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Трудовая деятельность</div>
    <ul style="margin:0; padding-left: 20px;">
      <li>09.1987 – 06.1993 гг. – студент Красноярского, Кызылского педагогических институтов</li>
      <li>09.1993 – 09.1994 гг. – учитель тувинского языка в начальных классах школы № 4 г. Кызыла</li>
      <li>09.1994 – 09.2016 гг. – инспектор по делам несовершеннолетних, старший инспектор по делам несовершеннолетних, начальник отделения организации работы подразделений по делам несовершеннолетних, начальник отдела организации деятельности участковых уполномоченных полиции и подразделений по делам несовершеннолетних МВД по Республике Тыва</li>
      <li>07.2016 – 12.2018 гг. – директор Агентства по делам семьи и детей в Республике Тыва</li>
      <li>12.2018 – 03.2020 гг. – министр труда и социальной политики Республики Тыва</li>
      <li>03.2020 – 04.2021 гг. – и.о. заместителя Председателя Правительства Республики Тыва, заместитель Председателя Правительства Республики Тыва</li>
      <li>04.2021 – 10.2021 гг. – и.о. заместителя Председателя Правительства Республики Тыва</li>
      <li>10.2021 – 05.2022 гг. – советник Главы Республики Тыва, Администрации Главы Республики Тыва и Аппарата Правительства Республики Тыва</li>
      <li>05.2022 – 03.2024 гг. – начальник управления по обеспечению деятельности Межведомственной комиссии по делам несовершеннолетних и защите их прав при Правительстве Республики Тыва (Руководитель аппарата Межведомственной комиссии по делам несовершеннолетних и защите их прав при Правительстве Республики Тыва) Администрации Главы Республики Тыва и Аппарата Правительства Республики Тыва</li>
      <li>27 марта 2024 года постановлением Верховного Хурала (Парламента) назначена на должность Уполномоченного по правам ребенка в Республике Тыва.</li>
    </ul>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Документы</div>
    <ul style="margin:0; padding-left: 20px; color: #003366">
      <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A0%20%D0%B7%D0%B0%202024%20%D0%B3.,%20%D0%BE%D0%BA%D0%BE%D0%BD%D1%87..docx" target="_blank" rel="noreferrer">Доклад о деятельности уполномоченного по правам ребенка в Республике Тыве за 2024 год (DOCX)</a></li>
    </ul>
  </div>
</div>
`;

function getSlugFromPath() {
  const path = typeof window !== "undefined" ? window.location.pathname || "" : "";

  // Поддерживаем оба формата: /p/:slug и /:section/:slug
  if (path.startsWith("/p/")) {
    return decodeURIComponent(path.slice(3));
  }

  // Для маршрутов типа /news/:slug, /deputies/:slug и т.д.
  // Извлекаем весь путь после первого сегмента
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 1) {
    // Возвращаем slug как "section/slug" или "slug" (например, info/finansy или opendata)
    return decodeURIComponent(segments.join("/"));
  }

  return "";
}

export default function PageBySlug() {
  const { lang, t } = useI18n();
  const adminData = useAdminData();
  const [slug, setSlug] = React.useState(() => getSlugFromPath());
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const update = () => setSlug(getSlugFromPath());
    window.addEventListener("popstate", update);
    window.addEventListener("app:navigate", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("app:navigate", update);
    };
  }, []);

  React.useEffect(() => {
    if (!slug) return;
    
    // Проверяем, является ли страница статической (не нужно делать запрос к API)
    const isStaticPage = [
      CODE_OF_HONOR_SLUG,
      MOTHERS_COMMANDMENTS_SLUG,
      FOR_MEDIA_SLUG,
      FEDERATION_COUNCIL_SLUG,
      INFO_INDEX_SLUG,
      INFO_FINANCE_SLUG,
      INFO_FINANCE_CHECKS_SLUG,
      INFO_FINANCE_CHECKS_2016_SLUG,
      INFO_FINANCE_CHECKS_2018_SLUG,
      INFO_FINANCE_CHECKS_2019_SLUG,
      INFO_FINANCE_CHECKS_2020_SLUG,
      INFO_FINANCE_PROCUREMENT_SLUG,
      INFO_FINANCE_REPORTS_SLUG,
      INFO_FINANCE_REPORTS_2015_SLUG,
      INFO_FINANCE_REPORTS_2016_SLUG,
      INFO_FINANCE_REPORTS_2017_SLUG,
      INFO_FINANCE_REPORTS_2018_SLUG,
      INFO_FINANCE_REPORTS_2019_SLUG,
      INFO_FINANCE_REPORTS_2020_SLUG,
      INFO_FINANCE_REPORTS_2021_SLUG,
      INFO_FINANCE_REPORTS_2022_SLUG,
      INFO_FINANCE_REPORTS_2023_SLUG,
      INFO_BUDGET_SLUG,
      INFO_DISTRICTS_SLUG,
      INFO_LAWMAP_SLUG,
      INFO_HISTORY_SLUG,
      INFO_POLNOMOCHIYA_SLUG,
      OPENDATA_SLUG,
      INFO_OMBUDSMAN_HUMAN_SLUG,
      INFO_OMBUDSMAN_CHILD_SLUG,
      INFO_PERSONNEL_SLUG,
      INFO_PERSONNEL_GOSLUZHPBA_SLUG,
      INFO_PERSONNEL_PORYADOK_SLUG,
      INFO_PERSONNEL_LAW58FZ_SLUG,
      INFO_PERSONNEL_LAW79FZ_SLUG,
      INFO_PERSONNEL_LAW112_SLUG,
      INFO_PERSONNEL_TELEFON_SLUG,
      INFO_PERSONNEL_OBZHALOVANIE_SLUG,
      INFO_PERSONNEL_PENSION_SLUG,
      INFO_PERSONNEL_OTPUSK_SLUG,
    ].includes(slug);
    
    // Для статических страниц не делаем запрос к API
    if (isStaticPage) {
      setPage(null);
      setLoading(false);
      return;
    }
    
    const locale = getPreferredLocaleToken(lang);
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await AboutApi.getPageBySlug(slug, { locale });
        if (!alive) return;
        setPage(res || null);
      } catch (e) {
        if (!alive) return;
        setError(e);
        setPage(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [lang, slug]);

  const locale = getPreferredLocaleToken(lang);
  const isCodeOfHonor = slug === CODE_OF_HONOR_SLUG;
  const isMothersCommandments = slug === MOTHERS_COMMANDMENTS_SLUG;
  const isForMedia = slug === FOR_MEDIA_SLUG;
  const isFederationCouncil = slug === FEDERATION_COUNCIL_SLUG;
  const isInfoIndex = slug === INFO_INDEX_SLUG;
  const isInfoFinance = slug === INFO_FINANCE_SLUG;
  const isInfoFinanceChecks = slug === INFO_FINANCE_CHECKS_SLUG;
  const isInfoFinanceChecks2016 = slug === INFO_FINANCE_CHECKS_2016_SLUG;
  const isInfoFinanceChecks2018 = slug === INFO_FINANCE_CHECKS_2018_SLUG;
  const isInfoFinanceChecks2019 = slug === INFO_FINANCE_CHECKS_2019_SLUG;
  const isInfoFinanceChecks2020 = slug === INFO_FINANCE_CHECKS_2020_SLUG;
  const isInfoFinanceProcurement = slug === INFO_FINANCE_PROCUREMENT_SLUG;
  const isInfoFinanceReports = slug === INFO_FINANCE_REPORTS_SLUG;
  const isInfoFinanceReports2015 = slug === INFO_FINANCE_REPORTS_2015_SLUG;
  const isInfoFinanceReports2016 = slug === INFO_FINANCE_REPORTS_2016_SLUG;
  const isInfoFinanceReports2017 = slug === INFO_FINANCE_REPORTS_2017_SLUG;
  const isInfoFinanceReports2018 = slug === INFO_FINANCE_REPORTS_2018_SLUG;
  const isInfoFinanceReports2019 = slug === INFO_FINANCE_REPORTS_2019_SLUG;
  const isInfoFinanceReports2020 = slug === INFO_FINANCE_REPORTS_2020_SLUG;
  const isInfoFinanceReports2021 = slug === INFO_FINANCE_REPORTS_2021_SLUG;
  const isInfoFinanceReports2022 = slug === INFO_FINANCE_REPORTS_2022_SLUG;
  const isInfoFinanceReports2023 = slug === INFO_FINANCE_REPORTS_2023_SLUG;
  const isInfoBudget = slug === INFO_BUDGET_SLUG;
  const isInfoDistricts = slug === INFO_DISTRICTS_SLUG;
  const isInfoLawmap = slug === INFO_LAWMAP_SLUG;
  const isInfoHistory = slug === INFO_HISTORY_SLUG;
  const isInfoPolnomochiya = slug === INFO_POLNOMOCHIYA_SLUG;
  const isOpenData = slug === OPENDATA_SLUG;
  const isInfoOmbHuman = slug === INFO_OMBUDSMAN_HUMAN_SLUG;
  const isInfoOmbChild = slug === INFO_OMBUDSMAN_CHILD_SLUG;
  const isInfoPersonnel = slug === INFO_PERSONNEL_SLUG;
  const isInfoPersonnelGossluzhba = slug === INFO_PERSONNEL_GOSLUZHPBA_SLUG;
  const isInfoPersonnelPoryadok = slug === INFO_PERSONNEL_PORYADOK_SLUG;
  const isInfoPersonnelLaw58fz = slug === INFO_PERSONNEL_LAW58FZ_SLUG;
  const isInfoPersonnelLaw79fz = slug === INFO_PERSONNEL_LAW79FZ_SLUG;
  const isInfoPersonnelLaw112 = slug === INFO_PERSONNEL_LAW112_SLUG;
  const isInfoPersonnelTelefon = slug === INFO_PERSONNEL_TELEFON_SLUG;
  const isInfoPersonnelObzhalovanie = slug === INFO_PERSONNEL_OBZHALOVANIE_SLUG;
  const isInfoPersonnelPension = slug === INFO_PERSONNEL_PENSION_SLUG;
  const isInfoPersonnelOtpusk = slug === INFO_PERSONNEL_OTPUSK_SLUG;

  const hasPageFromCms = !!page;
  const shouldUseInfoFallback =
    !hasPageFromCms &&
    (isCodeOfHonor ||
      isMothersCommandments ||
      isInfoIndex ||
      isInfoFinance ||
      isInfoFinanceChecks ||
      isInfoFinanceChecks2016 ||
      isInfoFinanceChecks2018 ||
      isInfoFinanceChecks2019 ||
      isInfoFinanceChecks2020 ||
      isInfoFinanceProcurement ||
      isInfoFinanceReports ||
      isInfoFinanceReports2015 ||
      isInfoFinanceReports2016 ||
      isInfoFinanceReports2017 ||
      isInfoFinanceReports2018 ||
      isInfoFinanceReports2019 ||
      isInfoFinanceReports2020 ||
      isInfoFinanceReports2021 ||
      isInfoFinanceReports2022 ||
      isInfoFinanceReports2023 ||
      isInfoBudget ||
      isInfoDistricts ||
      isInfoLawmap ||
      isInfoHistory ||
      isInfoPolnomochiya ||
      isOpenData ||
      isInfoOmbHuman ||
      isInfoOmbChild ||
      isInfoPersonnel ||
      isInfoPersonnelGossluzhba ||
      isInfoPersonnelPoryadok ||
      isInfoPersonnelLaw58fz ||
      isInfoPersonnelLaw79fz ||
      isInfoPersonnelLaw112 ||
      isInfoPersonnelTelefon ||
      isInfoPersonnelObzhalovanie ||
      isInfoPersonnelPension ||
      isInfoPersonnelOtpusk);

  const isStaticPage =
    isCodeOfHonor ||
    isMothersCommandments ||
    isForMedia ||
    isFederationCouncil ||
    shouldUseInfoFallback;

  // Определяем URL для кнопки "Назад"
  const backUrl = isInfoFinanceChecks2016 || isInfoFinanceChecks2018 || isInfoFinanceChecks2019 || isInfoFinanceChecks2020
    ? "/info/finansy/rezultaty-proverok"
    : isInfoFinanceReports2015 || isInfoFinanceReports2016 || isInfoFinanceReports2017 || 
      isInfoFinanceReports2018 || isInfoFinanceReports2019 || isInfoFinanceReports2020 ||
      isInfoFinanceReports2021 || isInfoFinanceReports2022 || isInfoFinanceReports2023
    ? "/info/finansy/otcheti"
    : isInfoFinanceChecks || isInfoFinanceProcurement || isInfoFinanceReports || isInfoBudget
    ? "/info/finansy"
    : isInfoDistricts || isInfoLawmap || isInfoHistory || isInfoPolnomochiya || isOpenData ||
      isInfoOmbHuman || isInfoOmbChild
    ? "/info"
    : isInfoPersonnelGossluzhba || isInfoPersonnelPoryadok || isInfoPersonnelLaw58fz ||
      isInfoPersonnelLaw79fz || isInfoPersonnelLaw112 || isInfoPersonnelTelefon ||
      isInfoPersonnelObzhalovanie || isInfoPersonnelPension || isInfoPersonnelOtpusk
    ? "/info/personnel"
    : isInfoFinance || isInfoIndex
    ? "/info"
    : isMothersCommandments || isCodeOfHonor
    ? "/about"
    : isForMedia
    ? "/info"
    : isFederationCouncil
    ? "/info"
    : "/info";

  // Определяем текст для кнопки "Назад"
  const backText = isInfoFinanceChecks2016 || isInfoFinanceChecks2018 || isInfoFinanceChecks2019 || isInfoFinanceChecks2020
    ? t("← Назад к результатам проверок")
    : isInfoFinanceReports2015 || isInfoFinanceReports2016 || isInfoFinanceReports2017 || 
      isInfoFinanceReports2018 || isInfoFinanceReports2019 || isInfoFinanceReports2020 ||
      isInfoFinanceReports2021 || isInfoFinanceReports2022 || isInfoFinanceReports2023
    ? t("← Назад к отчетам")
    : isInfoFinanceChecks || isInfoFinanceProcurement || isInfoFinanceReports || isInfoBudget
    ? t("← Назад к финансам")
    : isInfoDistricts || isInfoLawmap || isInfoHistory || isInfoPolnomochiya || isOpenData ||
      isInfoOmbHuman || isInfoOmbChild
    ? t("← Назад к информации")
    : isInfoPersonnelGossluzhba || isInfoPersonnelPoryadok || isInfoPersonnelLaw58fz ||
      isInfoPersonnelLaw79fz || isInfoPersonnelLaw112 || isInfoPersonnelTelefon ||
      isInfoPersonnelObzhalovanie || isInfoPersonnelPension || isInfoPersonnelOtpusk
    ? t("← Назад к кадровому обеспечению")
    : isInfoFinance || isInfoIndex
    ? t("← Назад к информации")
    : isMothersCommandments || isCodeOfHonor
    ? t("← Назад к общим сведениям")
    : t("← Назад");

  // Получаем заголовок с переводом
  const title = isCodeOfHonor
    ? t(CODE_OF_HONOR_TITLE) || CODE_OF_HONOR_TITLE
    : isMothersCommandments
      ? t(MOTHERS_COMMANDMENTS_TITLE) || MOTHERS_COMMANDMENTS_TITLE
      : isForMedia
        ? t(FOR_MEDIA_TITLE) || FOR_MEDIA_TITLE
        : isFederationCouncil
          ? t(FEDERATION_COUNCIL_TITLE) || FEDERATION_COUNCIL_TITLE
          : shouldUseInfoFallback
            ? isInfoIndex
              ? t(INFO_INDEX_TITLE) || INFO_INDEX_TITLE
              : isInfoFinance
                ? t(INFO_FINANCE_TITLE) || INFO_FINANCE_TITLE
                : isInfoFinanceChecks
                  ? t(INFO_FINANCE_CHECKS_TITLE) || INFO_FINANCE_CHECKS_TITLE
                  : isInfoFinanceChecks2016
                    ? t(INFO_FINANCE_CHECKS_2016_TITLE) || INFO_FINANCE_CHECKS_2016_TITLE
                    : isInfoFinanceChecks2018
                      ? t(INFO_FINANCE_CHECKS_2018_TITLE) || INFO_FINANCE_CHECKS_2018_TITLE
                      : isInfoFinanceChecks2019
                        ? t(INFO_FINANCE_CHECKS_2019_TITLE) || INFO_FINANCE_CHECKS_2019_TITLE
                        : isInfoFinanceChecks2020
                          ? t(INFO_FINANCE_CHECKS_2020_TITLE) || INFO_FINANCE_CHECKS_2020_TITLE
                          : isInfoFinanceProcurement
                            ? t(INFO_FINANCE_PROCUREMENT_TITLE) || INFO_FINANCE_PROCUREMENT_TITLE
                            : isInfoFinanceReports
                              ? t(INFO_FINANCE_REPORTS_TITLE) || INFO_FINANCE_REPORTS_TITLE
                              : isInfoFinanceReports2015
                                ? t(INFO_FINANCE_REPORTS_2015_TITLE) || INFO_FINANCE_REPORTS_2015_TITLE
                                : isInfoFinanceReports2016
                                  ? t(INFO_FINANCE_REPORTS_2016_TITLE) || INFO_FINANCE_REPORTS_2016_TITLE
                                  : isInfoFinanceReports2017
                                    ? t(INFO_FINANCE_REPORTS_2017_TITLE) || INFO_FINANCE_REPORTS_2017_TITLE
                                    : isInfoFinanceReports2018
                                      ? t(INFO_FINANCE_REPORTS_2018_TITLE) || INFO_FINANCE_REPORTS_2018_TITLE
                                      : isInfoFinanceReports2019
                                        ? t(INFO_FINANCE_REPORTS_2019_TITLE) || INFO_FINANCE_REPORTS_2019_TITLE
                                        : isInfoFinanceReports2020
                                          ? t(INFO_FINANCE_REPORTS_2020_TITLE) || INFO_FINANCE_REPORTS_2020_TITLE
                                          : isInfoFinanceReports2021
                                            ? t(INFO_FINANCE_REPORTS_2021_TITLE) || INFO_FINANCE_REPORTS_2021_TITLE
                                            : isInfoFinanceReports2022
                                              ? t(INFO_FINANCE_REPORTS_2022_TITLE) || INFO_FINANCE_REPORTS_2022_TITLE
                                              : isInfoFinanceReports2023
                                                ? t(INFO_FINANCE_REPORTS_2023_TITLE) || INFO_FINANCE_REPORTS_2023_TITLE
                                                : isInfoBudget
                                                  ? t(INFO_BUDGET_TITLE) || INFO_BUDGET_TITLE
                                                  : isInfoDistricts
                            ? t(INFO_DISTRICTS_TITLE) || INFO_DISTRICTS_TITLE
                            : isInfoLawmap
                              ? t(INFO_LAWMAP_TITLE) || INFO_LAWMAP_TITLE
                              : isInfoHistory
                                ? t(INFO_HISTORY_TITLE) || INFO_HISTORY_TITLE
                                : isInfoPolnomochiya
                                  ? t(INFO_POLNOMOCHIYA_TITLE) || INFO_POLNOMOCHIYA_TITLE
                                  : isOpenData
                                ? t(OPENDATA_TITLE) || OPENDATA_TITLE
                                : isInfoOmbHuman
                                  ? t(INFO_OMBUDSMAN_HUMAN_TITLE) || INFO_OMBUDSMAN_HUMAN_TITLE
                                  : isInfoOmbChild
                                    ? t(INFO_OMBUDSMAN_CHILD_TITLE) || INFO_OMBUDSMAN_CHILD_TITLE
                                    : isInfoPersonnel
                                      ? t(INFO_PERSONNEL_TITLE) || INFO_PERSONNEL_TITLE
                                      : isInfoPersonnelGossluzhba
                                        ? t(INFO_PERSONNEL_GOSLUZHPBA_TITLE) || INFO_PERSONNEL_GOSLUZHPBA_TITLE
                                        : isInfoPersonnelPoryadok
                                          ? t(INFO_PERSONNEL_PORYADOK_TITLE) || INFO_PERSONNEL_PORYADOK_TITLE
                                          : isInfoPersonnelLaw58fz
                                            ? t(INFO_PERSONNEL_LAW58FZ_TITLE) || INFO_PERSONNEL_LAW58FZ_TITLE
                                            : isInfoPersonnelLaw79fz
                                              ? t(INFO_PERSONNEL_LAW79FZ_TITLE) || INFO_PERSONNEL_LAW79FZ_TITLE
                                              : isInfoPersonnelLaw112
                                                ? t(INFO_PERSONNEL_LAW112_TITLE) || INFO_PERSONNEL_LAW112_TITLE
                                                : isInfoPersonnelTelefon
                                                  ? t(INFO_PERSONNEL_TELEFON_TITLE) || INFO_PERSONNEL_TELEFON_TITLE
                                                  : isInfoPersonnelObzhalovanie
                                                    ? t(INFO_PERSONNEL_OBZHALOVANIE_TITLE) || INFO_PERSONNEL_OBZHALOVANIE_TITLE
                                                    : isInfoPersonnelPension
                                                      ? t(INFO_PERSONNEL_PENSION_TITLE) || INFO_PERSONNEL_PENSION_TITLE
                                                      : isInfoPersonnelOtpusk
                                                        ? t(INFO_PERSONNEL_OTPUSK_TITLE) || INFO_PERSONNEL_OTPUSK_TITLE
                                                        : extractPageTitle(page, locale, slug)
        : extractPageTitle(page, locale, slug);
  const html = isCodeOfHonor
    ? CODE_OF_HONOR_HTML
    : isMothersCommandments
      ? MOTHERS_COMMANDMENTS_HTML
      : isForMedia
        ? FOR_MEDIA_HTML
        : isFederationCouncil
          ? FEDERATION_COUNCIL_HTML
          : shouldUseInfoFallback
            ? isInfoIndex
              ? INFO_INDEX_HTML
              : isInfoFinance
                ? INFO_FINANCE_HTML
                : isInfoFinanceChecks
                  ? INFO_FINANCE_CHECKS_HTML
                  : isInfoFinanceChecks2016
                    ? INFO_FINANCE_CHECKS_2016_HTML
                    : isInfoFinanceChecks2018
                      ? INFO_FINANCE_CHECKS_2018_HTML
                      : isInfoFinanceChecks2019
                        ? INFO_FINANCE_CHECKS_2019_HTML
                        : isInfoFinanceChecks2020
                          ? INFO_FINANCE_CHECKS_2020_HTML
                          : isInfoFinanceProcurement
                            ? INFO_FINANCE_PROCUREMENT_HTML
                            : isInfoFinanceReports
                              ? INFO_FINANCE_REPORTS_HTML
                              : isInfoFinanceReports2015
                                ? INFO_FINANCE_REPORTS_2015_HTML
                                : isInfoFinanceReports2016
                                  ? INFO_FINANCE_REPORTS_2016_HTML
                                  : isInfoFinanceReports2017
                                    ? INFO_FINANCE_REPORTS_2017_HTML
                                    : isInfoFinanceReports2018
                                      ? INFO_FINANCE_REPORTS_2018_HTML
                                      : isInfoFinanceReports2019
                                        ? INFO_FINANCE_REPORTS_2019_HTML
                                        : isInfoFinanceReports2020
                                          ? INFO_FINANCE_REPORTS_2020_HTML
                                          : isInfoFinanceReports2021
                                            ? INFO_FINANCE_REPORTS_2021_HTML
                                            : isInfoFinanceReports2022
                                              ? INFO_FINANCE_REPORTS_2022_HTML
                                              : isInfoFinanceReports2023
                                                ? INFO_FINANCE_REPORTS_2023_HTML
                                                : isInfoBudget
                                                  ? INFO_BUDGET_HTML
                                                  : isInfoDistricts
                            ? INFO_DISTRICTS_HTML
                            : isInfoLawmap
                              ? INFO_LAWMAP_HTML
                              : isInfoHistory
                                ? INFO_HISTORY_HTML
                                : isInfoPolnomochiya
                                  ? INFO_POLNOMOCHIYA_HTML
                                  : isOpenData
                                ? OPENDATA_HTML
                                : isInfoOmbHuman
                                  ? INFO_OMBUDSMAN_HUMAN_HTML
                                  : isInfoOmbChild
                                    ? INFO_OMBUDSMAN_CHILD_HTML
                                    : isInfoPersonnel
                                      ? INFO_PERSONNEL_HTML
                                      : isInfoPersonnelGossluzhba
                                        ? INFO_PERSONNEL_GOSLUZHPBA_HTML
                                        : isInfoPersonnelPoryadok
                                          ? INFO_PERSONNEL_PORYADOK_HTML
                                          : isInfoPersonnelLaw58fz
                                            ? INFO_PERSONNEL_LAW58FZ_HTML
                                            : isInfoPersonnelLaw79fz
                                              ? INFO_PERSONNEL_LAW79FZ_HTML
                                              : isInfoPersonnelLaw112
                                                ? INFO_PERSONNEL_LAW112_HTML
                                                : isInfoPersonnelTelefon
                                                  ? INFO_PERSONNEL_TELEFON_HTML
                                                  : isInfoPersonnelObzhalovanie
                                                    ? INFO_PERSONNEL_OBZHALOVANIE_HTML
                                                    : isInfoPersonnelPension
                                                      ? INFO_PERSONNEL_PENSION_HTML
                                                      : isInfoPersonnelOtpusk
                                                        ? INFO_PERSONNEL_OTPUSK_HTML
                                                        : extractPageHtml(page, locale)
          : extractPageHtml(page, locale);

  // Определяем slug для админки
  const adminPageSlug = isCodeOfHonor
    ? CODE_OF_HONOR_SLUG
    : isMothersCommandments
      ? MOTHERS_COMMANDMENTS_SLUG
      : isForMedia
        ? FOR_MEDIA_SLUG
        : isFederationCouncil
          ? FEDERATION_COUNCIL_SLUG
          : shouldUseInfoFallback
            ? isInfoIndex
              ? INFO_INDEX_SLUG
              : isInfoFinance
                ? INFO_FINANCE_SLUG
                : isInfoDistricts
                  ? INFO_DISTRICTS_SLUG
                  : isInfoLawmap
                    ? INFO_LAWMAP_SLUG
                    : isOpenData
                      ? OPENDATA_SLUG
                      : isInfoOmbHuman
                        ? INFO_OMBUDSMAN_HUMAN_SLUG
                        : isInfoOmbChild
                          ? INFO_OMBUDSMAN_CHILD_SLUG
                          : isInfoPersonnel
                            ? INFO_PERSONNEL_SLUG
                            : slug
          : slug;

  const canEdit = adminData?.canWrite && isStaticPage;

  return (
    <section className="section">
      <div className="container">
        <div className="page-grid">
          <div>
            <div style={{ marginBottom: 16 }}>
              <a href={backUrl} className="btn" style={{ padding: "8px 16px", fontSize: 14 }}>
                {backText}
              </a>
            </div>
            <h1 className="h1-compact">{title}</h1>
            <DataState
              loading={loading}
              error={error}
              empty={!isStaticPage && !loading && !page}
              emptyDescription="Страница не найдена"
            >
              <div className="card" style={{ padding: 18 }}>
                {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : <div>—</div>}
              </div>
              {canEdit && (
                <div style={{ marginTop: 20 }}>
                  <a href={`/admin/pages/edit/${adminPageSlug}`} className="btn" style={{ fontSize: 14 }}>
                    Редактировать в админке →
                  </a>
                </div>
              )}
            </DataState>
          </div>
          <SideNav title={title} loadPages={true} autoSection={true} />
        </div>
      </div>
    </section>
  );
}
