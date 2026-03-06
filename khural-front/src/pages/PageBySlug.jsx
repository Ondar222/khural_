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
  <ul>
    <li><a href="https://khural.rtyva.ru/info/finansy/160/" target="_blank" rel="noreferrer">Результаты проверок</a></li>
    <li><a href="https://khural.rtyva.ru/info/finansy/73/" target="_blank" rel="noreferrer">Отчеты</a></li>
    <li><a href="https://khural.rtyva.ru/info/finansy/107/" target="_blank" rel="noreferrer">Госзакупки</a></li>
    <li><a href="https://khural.rtyva.ru/info/finansy/108/" target="_blank" rel="noreferrer">Бюджет</a></li>
  </ul>
  <p style="margin:0; line-height:1.7;">
    С 1 января 2011 г. информация о процедурах государственных закупок размещается на едином официальном сайте РФ:
    <a href="http://zakupki.gov.ru/epz/order/extendedsearch/results.html?customerInn=1701009892" target="_blank" rel="noreferrer">zakupki.gov.ru</a>.
  </p>
  <p style="margin:0; line-height:1.7;">
    Информацию по действующим и завершенным процедурам государственных закупок можно получить по телефону 8(39422) 2-32-24.
  </p>
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
      <div><strong>Идентификатор:</strong> 1701009892-maininfo</div>
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
        <li>С 2004 - 2004г. начальник службы экономического развития в ЗАО группа «Февраль».</li>
        <li>2005 – 2006 г. директор Новосибирского филиала некоммерческого партнерства «Сибирская межрегиональная саморегулируемая организация арбитражных управляющих».</li>
        <li>2007 – 2007 г. начальник отдела юридического и кадрового обеспечения управления Росприроднадзора по Новосибирской области Федеральной службы по надзору в сфере природопользования РФ.</li>
        <li>2007 – 2009 г. заместитель руководителя аппарата Правительства Республики Тыва - начальник управления правовой экспертизы и систематизации законодательства.</li>
        <li>2009 – 2017 г. руководитель управления Росприроднадзора по Республике Тыва Федеральной службы по надзору в сфере природопользования РФ.</li>
      </ul>
    </div>

    <div class="ombudsman-page__block">
      <div class="ombudsman-page__block-title">Контакты и адреса</div>
      <div class="ombudsman-page__kv">
        <div><strong>Телефон:</strong> +7(394-22)-2-63-08</div>
        <div><strong>Адрес:</strong> 667010, Республика Тыва, г. Кызыл, ул. Красноармейская д.100, каб. 402</div>
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
      <li><a href="https://khural.rtyva.ru/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A0%20%D0%B7%D0%B0%202024%20%D0%B3.,%20%D0%BE%D0%BA%D0%BE%D0%BD%D1%87..docx" target="_blank" rel="noreferrer">Доклад за 2024 год (DOCX)</a></li>
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
  const { lang } = useI18n();
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

  const title = isCodeOfHonor
    ? CODE_OF_HONOR_TITLE
    : isMothersCommandments
      ? MOTHERS_COMMANDMENTS_TITLE
      : isForMedia
        ? FOR_MEDIA_TITLE
        : isFederationCouncil
          ? FEDERATION_COUNCIL_TITLE
          : shouldUseInfoFallback
            ? isInfoIndex
              ? INFO_INDEX_TITLE
              : isInfoFinance
                ? INFO_FINANCE_TITLE
                : isInfoDistricts
                  ? INFO_DISTRICTS_TITLE
                  : isInfoLawmap
                    ? INFO_LAWMAP_TITLE
                    : isOpenData
                      ? OPENDATA_TITLE
                      : isInfoOmbHuman
                        ? INFO_OMBUDSMAN_HUMAN_TITLE
                        : isInfoOmbChild
                          ? INFO_OMBUDSMAN_CHILD_TITLE
                          : isInfoPersonnel
                            ? INFO_PERSONNEL_TITLE
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
