import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import { useAdminData } from "../hooks/useAdminData.js";
import DataState from "../components/DataState.jsx";
import { extractPageHtml, extractPageTitle, getPreferredLocaleToken } from "../utils/pages.js";
import { FOR_MEDIA_HTML, FOR_MEDIA_SLUG, FOR_MEDIA_TITLE } from "../content/forMedia.js";

/** Статический контент страницы «Кодекс чести мужчины Тувы» (источник: khural.rtyva.ru). */
const CODE_OF_HONOR_SLUG = "code-of-honor";
const CODE_OF_HONOR_TITLE = "Кодекс чести мужчины Тувы";
const CODE_OF_HONOR_HTML = `
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
const MOTHERS_COMMANDMENTS_TITLE = "Свод заповедей матерей Тувы";
const MOTHERS_COMMANDMENTS_HTML = `
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/rezultaty-proverok" style="color: #003366; text-decoration: none;">← Назад к результатам проверок</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/rezultaty-proverok" style="color: #003366; text-decoration: none;">← Назад к результатам проверок</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/rezultaty-proverok" style="color: #003366; text-decoration: none;">← Назад к результатам проверок</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/rezultaty-proverok" style="color: #003366; text-decoration: none;">← Назад к результатам проверок</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy" style="color: #003366; text-decoration: none;">← Назад к финансам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy" style="color: #003366; text-decoration: none;">← Назад к финансам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy/otcheti" style="color: #003366; text-decoration: none;">← Назад к отчетам</a>
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
  <div style="margin-top: 16px;">
    <a href="/info/finansy" style="color: #003366; text-decoration: none;">← Назад к финансам</a>
  </div>
</div>
`;

const INFO_DISTRICTS_SLUG = "info/iokrug";
const INFO_DISTRICTS_TITLE = "Избирательные округа";
const INFO_DISTRICTS_HTML = `
<div style="display:grid; gap:10px;">
  <p style="margin:0; line-height:1.7;">
    Контент этой страницы будет перенесен со старого сайта. Сейчас исходный раздел временно отвечает слишком медленно.
  </p>
  <p style="margin:0;">
    Открыть на старом сайте:
    <a href="https://khural.rtyva.ru/info/iokrug/" target="_blank" rel="noreferrer">khural.rtyva.ru/info/iokrug</a>
  </p>
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
    Полная версия на старом сайте:
    <a href="https://khural.rtyva.ru/info/zakon_karta.php" target="_blank" rel="noreferrer">Законодательная карта сайта</a>
  </p>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Быстрые ссылки</div>
    <ul>
      <li><a href="/section" rel="noreferrer">Структура</a></li>
      <li><a href="/contacts" rel="noreferrer">Контактная информация</a></li>
      <li><a href="/apparatus" rel="noreferrer">Аппарат</a></li>
      <li><a href="/docs/laws" rel="noreferrer">Документы</a></li>
      <li><a href="/news" rel="noreferrer">Новости</a></li>
    </ul>
  </div>
</div>
`;

const OPENDATA_SLUG = "opendata";
const OPENDATA_TITLE = "Открытые данные";
const OPENDATA_HTML = `
<div style="display:grid; gap:12px; line-height:1.7;">
  <p style="margin:0;">
    В этом разделе представлена информация о деятельности Верховного Хурала (парламента) Республики Тыва, размещаемая в сети «Интернет» в форме открытых данных.
    Предложения и отзывы вы можете оставить через
    <a href="https://khural.rtyva.ru/services/feedback/" target="_blank" rel="noreferrer">форму обратной связи</a>.
  </p>
  <div class="card" style="padding: 12px; background: rgba(255,255,255,0.55);">
    <div style="font-weight:800; margin-bottom:8px;">Набор данных</div>
    <div style="display:grid; gap:6px;">
      <div><strong>Идентиф��катор:</strong> 1701009892-maininfo</div>
      <div><strong>Наименование:</strong> Общая информация о Верховном Хурале (парламенте) Республики Тыва</div>
      <div><strong>Формат:</strong> CSV</div>
      <div>
        <strong>Файлы:</strong>
        <a href="https://khural.rtyva.ru/docs/1701009892-maininfo2.csv" target="_blank" rel="noreferrer">CSV</a>,
        <a href="https://khural.rtyva.ru/opendata/1701009892-structure-20170309.csv" target="_blank" rel="noreferrer">Описание структуры</a>
      </div>
    </div>
  </div>
  <p style="margin:0;">
    Условия использования набора данных и подробности доступны на старом сайте:
    <a href="https://khural.rtyva.ru/opendata/" target="_blank" rel="noreferrer">khural.rtyva.ru/opendata</a>
  </p>
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
      <div class="ombudsman-page__title">${INFO_OMBUDSMAN_HUMAN_TITLE}</div>
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
        <li>1985 – 2003 г. служба в органах прокуратуры Тувинской АССР, Томской и Новосибирской области.</li>
        <li>2003 - 2004 заместитель руководителя Межрегионального территориального органа в Сибирском федеральном округе федеральной службы РФ по финансовому оздоровлению и банкротству.</li>
        <li>С 2004 - 2004г. начальник службы экономическ����������го развития в ЗАО группа «Февраль».</li>
        <li>2005 – 2006 г. д��ректор Новосибирского филиала некоммерческого партнерства «Сибирская межрегиональная саморегулируемая организация арбитражных управляющих».</li>
        <li>2007 – 2007 г. начальник отдела юридического и кадрового обеспечения управления Росприроднадзора по Новосибирской области Федеральной службы по надзору в сфере природопользования РФ.</li>
        <li>2007 – 2009 г. заместитель руководителя аппарата Правительства Республики Тыва - начальник управления правовой экспертизы и систематизации законодательства.</li>
        <li>2009 – 2017 г. руководитель управления Росприроднадзора по Республике Тыва Федеральной службы по надзору в сфере природопользования РФ.</li>
      </ul>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Кон��акты и адреса</div>
      <div class="ombudsman-page__kv">
        <div><strong>Телефон:</strong> +7(394-22)-2-63-08</div>
        <div><strong>Адрес:</strong> 667010, Республика Тыва, г. Кызыл, ул. Красноарм��йская д.100, каб. 402</div>
        <div><strong>E-mail:</strong> <a href="mailto:ombudsman@rtyva.ru">ombudsman@rtyva.ru</a></div>
      </div>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Доклады</div>
      <ul>
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A7%20%D0%B7%D0%B0%202022%20%D0%B3..pdf" target="_blank" rel="noreferrer">Доклад за 2022 год (PDF)</a></li>
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%90%D0%B4%D1%8B%D0%B3%D0%B1%D0%B0%D0%B9%20%D0%90.%D0%9C.%20%D0%B7%D0%B0%202024%20%D0%B3%D0%BE%D0%B4.pdf" target="_blank" rel="noreferrer">Доклад за 2024 год (PDF)</a></li>
        <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%B7%D0%B0%202021%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer">Доклад за 2021 год (DOCX)</a></li>
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
    <div>E-mail: <a href="mailto:saidasengii@mail.ru">saidasengii@mail.ru</a></div>
    <div>E-mail: <a href="mailto:tyvarfdeti@rtyva.ru">tyvarfdeti@rtyva.ru</a></div>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Краткая биография</div>
    <div>Родилась 17 мая 1970 года в г. Кызыле.</div>
    <div><strong>Образование:</strong> Кызылский государственный педагогический институт (1993), Сибирский юридический институт МВД России (2007).</div>
    <div><strong>Награды:</strong> медаль РТ «За доблестный труд» (2007), юбилейная медаль 100‑летия ТНР (2021).</div>
  </div>
  <div style="display:grid; gap:6px;">
    <div style="font-weight:800;">Документы</div>
    <ul>
      <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A0%20%D0%B7%D0%B0%202024%20%D0%B3.,%20%D0%BE%D0%BA%D0%BE%D0%BD%D1%87..docx" target="_blank" rel="noreferrer">Доклад за 2024 го�� (DOCX)</a></li>
    </ul>
  </div>
  <p style="margin:0;">
    Полная версия на старом сайте:
    <a href="https://khural.rtyva.ru/info/upoln_po_reb.php" target="_blank" rel="noreferrer">khural.rtyva.ru/info/upoln_po_reb.php</a>
  </p>
</div>
`;

const INFO_PERSONNEL_SLUG = "info/personnel";
const INFO_PERSONNEL_TITLE = "Кадровое обеспечение";
const INFO_PERSONNEL_HTML = `
<div style="display:grid; gap:10px; line-height:1.7;">
  <ul>
    <li><a href="https://khural.rtyva.ru/info/personnel/443/" target="_blank" rel="noreferrer">Указ Президента РФ от 10.10.2024 № 870</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/444/" target="_blank" rel="noreferrer">Путеводитель по Госслужбе</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/285/" target="_blank" rel="noreferrer">Порядок оформления, выдачи и учета удостоверений</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/242/" target="_blank" rel="noreferrer">Положение о помощнике депутата</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/456/" target="_blank" rel="noreferrer">Документы при поступлении на госслужбу</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/4/" target="_blank" rel="noreferrer">Телефон для справок по вакансиям</a></li>
    <li><a href="https://khural.rtyva.ru/info/personnel/" target="_blank" rel="noreferrer">Все материалы раздела</a></li>
  </ul>
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
  const isOpenData = slug === OPENDATA_SLUG;
  const isInfoOmbHuman = slug === INFO_OMBUDSMAN_HUMAN_SLUG;
  const isInfoOmbChild = slug === INFO_OMBUDSMAN_CHILD_SLUG;
  const isInfoPersonnel = slug === INFO_PERSONNEL_SLUG;

  const hasPageFromCms = !!page;
  const shouldUseInfoFallback =
    !hasPageFromCms &&
    (isInfoIndex ||
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
      isOpenData ||
      isInfoOmbHuman ||
      isInfoOmbChild ||
      isInfoPersonnel);

  const isStaticPage =
    isCodeOfHonor ||
    isMothersCommandments ||
    isForMedia ||
    isFederationCouncil ||
    shouldUseInfoFallback;

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
                              : isOpenData
                                ? t(OPENDATA_TITLE) || OPENDATA_TITLE
                                : isInfoOmbHuman
                                  ? t(INFO_OMBUDSMAN_HUMAN_TITLE) || INFO_OMBUDSMAN_HUMAN_TITLE
                                  : isInfoOmbChild
                                    ? t(INFO_OMBUDSMAN_CHILD_TITLE) || INFO_OMBUDSMAN_CHILD_TITLE
                                    : isInfoPersonnel
                                      ? t(INFO_PERSONNEL_TITLE) || INFO_PERSONNEL_TITLE
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
                              : isOpenData
                                ? OPENDATA_HTML
                                : isInfoOmbHuman
                                  ? INFO_OMBUDSMAN_HUMAN_HTML
                                  : isInfoOmbChild
                                    ? INFO_OMBUDSMAN_CHILD_HTML
                                    : isInfoPersonnel
                                      ? INFO_PERSONNEL_HTML
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
    </section>
  );
}
