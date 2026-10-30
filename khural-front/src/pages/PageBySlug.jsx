import React from "react";
import { AboutApi } from "../api/client.js";
import { useI18n } from "../context/I18nContext.jsx";
import {
  INFO_PERSONNEL_SLUG,
  INFO_PERSONNEL_TITLE,
  INFO_PERSONNEL_HTML,
  INFO_PERSONNEL_GOSLUZHPBA_SLUG,
  INFO_PERSONNEL_GOSLUZHPBA_TITLE,
  INFO_PERSONNEL_GOSLUZHPBA_HTML,
  INFO_PERSONNEL_PORYADOK_SLUG,
  INFO_PERSONNEL_PORYADOK_TITLE,
  INFO_PERSONNEL_PORYADOK_HTML,
  INFO_PERSONNEL_LAW58FZ_SLUG,
  INFO_PERSONNEL_LAW58FZ_TITLE,
  INFO_PERSONNEL_LAW58FZ_HTML,
  INFO_PERSONNEL_LAW79FZ_SLUG,
  INFO_PERSONNEL_LAW79FZ_TITLE,
  INFO_PERSONNEL_LAW79FZ_HTML,
  INFO_PERSONNEL_LAW112_SLUG,
  INFO_PERSONNEL_LAW112_TITLE,
  INFO_PERSONNEL_LAW112_HTML,
  INFO_PERSONNEL_TELEFON_SLUG,
  INFO_PERSONNEL_TELEFON_TITLE,
  INFO_PERSONNEL_TELEFON_HTML,
  INFO_PERSONNEL_OBZHALOVANIE_SLUG,
  INFO_PERSONNEL_OBZHALOVANIE_TITLE,
  INFO_PERSONNEL_OBZHALOVANIE_HTML,
  INFO_PERSONNEL_PENSION_SLUG,
  INFO_PERSONNEL_PENSION_TITLE,
  INFO_PERSONNEL_PENSION_HTML,
  INFO_PERSONNEL_OTPUSK_SLUG,
  INFO_PERSONNEL_OTPUSK_TITLE,
  INFO_PERSONNEL_OTPUSK_HTML,
  INFO_PERSONNEL_VAKANSII_SLUG,
  INFO_PERSONNEL_VAKANSII_TITLE,
  INFO_PERSONNEL_VAKANSII_HTML,
  INFO_PERSONNEL_KONKURSY_SLUG,
  INFO_PERSONNEL_KONKURSY_TITLE,
  INFO_PERSONNEL_KONKURSY_HTML,
  INFO_PERSONNEL_METODIKA_SLUG,
  INFO_PERSONNEL_METODIKA_TITLE,
  INFO_PERSONNEL_METODIKA_HTML,
  INFO_PERSONNEL_KOMISSII_SLUG,
  INFO_PERSONNEL_KOMISSII_TITLE,
  INFO_PERSONNEL_KOMISSII_HTML,
  INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_SLUG,
  INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_TITLE,
  INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_HTML,
  INFO_PERSONNEL_KOMISSII_POLOZENIE_SLUG,
  INFO_PERSONNEL_KOMISSII_POLOZENIE_TITLE,
  INFO_PERSONNEL_KOMISSII_POLOZENIE_HTML,
  INFO_PERSONNEL_KOMISSII_SOSTAV_SLUG,
  INFO_PERSONNEL_KOMISSII_SOSTAV_TITLE,
  INFO_PERSONNEL_KOMISSII_SOSTAV_HTML,
  INFO_PERSONNEL_KOMISSII_RESHENIYA_SLUG,
  INFO_PERSONNEL_KOMISSII_RESHENIYA_TITLE,
  INFO_PERSONNEL_KOMISSII_RESHENIYA_HTML,
  INFO_PERSONNEL_DOKUMENTY_SLUG,
  INFO_PERSONNEL_DOKUMENTY_TITLE,
  INFO_PERSONNEL_DOKUMENTY_HTML,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_SLUG,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_TITLE,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_HTML,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_1_SLUG,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_1_TITLE,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_1_HTML,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_2_SLUG,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_2_TITLE,
  INFO_PERSONNEL_KONKURSY_PROTOKOL_2_HTML,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_SLUG,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_TITLE,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_HTML,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_SLUG,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_TITLE,
  INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_HTML,
  PERSONNEL_ROOT_PATH,
} from "../content/personnel.js";
import PdfPreviewModal from "../components/PdfPreviewModal.jsx";
import { useAdminData } from "../hooks/useAdminData.js";
import DataState from "../components/DataState.jsx";
import SideNav from "../components/SideNav.jsx";
import { normalizeSlugAlias } from "../utils/slugAliases.js";
import {
  extractPageHtml,
  extractPageTitle,
  getPreferredLocaleToken,
  hasLocalizedPageHtml,
} from "../utils/pages.js";
import { useAutomaticTranslation } from "../hooks/useTranslation.js";
import { FOR_MEDIA_HTML, FOR_MEDIA_SLUG, FOR_MEDIA_TITLE } from "../content/forMedia.js";

/** Статический контент страницы «Кодекс чести мужчины Тувы» (источник: khural.yurta.site). */
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

/** Статический контент страницы «Представительство в Совете Федерации» (источник: khural.yurta.site). */
const FEDERATION_COUNCIL_SLUG = "struct/council";
const FEDERATION_COUNCIL_TITLE = "Представительство в Совете Федерации";
const FEDERATION_COUNCIL_HTML = `
<div class="federation-council">
  <div class="federation-council__header">
    <img
      class="federation-council__photo"
      src="/docs/%D0%9A%D1%83%D0%B6%D1%83%D0%B3%D0%B5%D1%82.jfif"
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

/** Раздел «Общие сведения» (источник: khural.yurta.site). */
const INFO_INDEX_SLUG = "info";
const INFO_INDEX_TITLE = "Общие сведения";
const INFO_INDEX_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px;">
    <div style="line-height: 1.7; color: #374151;">
      <p style="margin:0 0 12px 0;">8 сентября 2019 года состоялись очередные выборы в высший законодательный (представительный) орган государственной власти Республики Тыва.</p>
      <p style="margin:0 0 12px 0;">Было избрано 32 депутата: 16 депутатов избраны по партийным спискам, остальные 16 – по одномандатным округам. В Верховном Хурале представлены два избирательных объединения: «Единой России» (30 мандатов), «ЛДПР» (2 мандата). Из 32 депутатов только 9 работают на постоянной основе.</p>
      <p style="margin:0 0 12px 0;">Депутатский корпус представлен опытными политиками, законодателями, многие из которых избирались неоднократно, профессиональными юристами, деятелями культуры, искусства, спортсменами, учителями, врачами, предпринимателями.</p>
      <p style="margin:0 0 12px 0;">Законотворческая деятельность Верховного Хурала (парламента) Республики Тыва осуществляется в тесном и плодотворном взаимодействии со всеми субъектами законодательной инициативы и, прежде всего с Правительством Республики Тыва.</p>
      <p style="margin:0 0 12px 0;">Кроме основной деятельности по совершенствованию законодательства, депутаты Верховного Хурала (парламента) Республики Тыва активно участвуют практически во всех социально значимых мероприятиях, благотворительных акциях, марафонах. Работу с избирателями, выезды в избирательные участки, рабочие командировками депутаты всегда стараются совместить с оказанием практической помощи: медицинской, консультационной.</p>
      <p style="margin:0 0 12px 0;">Ежедневно в Общественной приемной депутаты, работающие на постоянной основе, согласно графику ведут прием граждан.</p>
      <p style="margin:0 0 12px 0;">Материалы о Верховном Хурале, о его составе и структуре, новости о деятельности парламента, онлайн-трансляция заседаний сессии и многое другое размещаются на официальном сайте Верховного Хурала (парламента) Республики Тыва.</p>
      <p style="margin:0 0 12px 0;">Особое место занимает «Интернет-приемная», посредством которой избиратель может обратиться к депутату с предложением, просьбой или наказом.</p>
      <p style="margin:0 0 12px 0;">Главной целью депутатов Верховного Хурала (парламента) Республики Тыва является совершенствование регионального законодательства, представление интересов избирателей во властных структурах и защита их конституционных прав. В этом направлении депутаты Верховного Хурала (парламента) Республики Тыва действуют единой сплоченной командой.</p>
      <p style="margin:0 0 12px 0;">Депутатский корпус уверен, что добросовестное исполнение народными избранниками своих обязанностей увенчается достойными результатами во благо процветания родной Тувы.</p>
    </div>
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
        <li><a href="/upload/iblock/1f9/%D0%9E%20%D0%BD%D0%BE%D1%80%D0%BC%D0%B0%D1%82%D0%B8%D0%B2%D0%B0%D1%85%20%D0%B7%D0%B0%D0%BA%D1%83%D0%BF%D0%BE%D0%BA%20%D0%92%D0%A5%20%D0%A0%D0%A2.docx" target="_blank" rel="noreferrer" style="color: #003366;">О нормативах закупок Верховного Хурала (парламента) РТ</a></li>
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
        <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="/upload/iblock/178/ix4d70jwylfahx5ibn11bie0yutb17n0/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202019%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
        <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="/upload/iblock/cde/xascukpwi7wd04xxgi9p8znj1np0qoax/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202020%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
        <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="/upload/iblock/443/za4cch1k67p410j47y1fo7do1x8xp8bg/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202021%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
        <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="/upload/iblock/fc5/bzgwyoh85eb6w2igz5utd915zp5lu5k8/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202022%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
        <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">
            <a href="/upload/iblock/1b9/o51ka03fkpt5rsf6ozzgxl55vcvjv9vu/%D0%BE%D1%82%D1%87%D0%B5%D1%82%20%D0%BD%D0%B0%20%D1%81%D0%B0%D0%B9%D1%82%20-%20%D0%BE%D1%82%D1%87%D0%B5%D1%82%D0%BD%D0%BE%D1%81%D1%82%D1%8C%20%D0%B7%D0%B0%202023%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
            <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 600; color: #111827;">
                <a href="/docs/%D0%9A%D0%BE%D0%BD%D1%81%D1%82%D0%B8%D1%82%D1%83%D1%86%D0%B8%D1%8F%20%D0%A0%D0%B5%D1%81%D0%BF%D1%83%D0%B1%D0%BB%D0%B8%D0%BA%D0%B8%20%D0%A2%D1%8B%D0%B2%D0%B0.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
                  Конституция Республики Тыва
                </a>
              </div>
             
            </div>
          </div>
        </div>
        
        <div style="padding: 16px; background: #fff; border: 1px solid #dfe3eb; border-radius: 8px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="display:inline-flex;color:#003366;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></span>
            <div style="flex: 1; min-width: 200px;">
              <div style="font-weight: 600; color: #111827;">
                <a href="/docs/%D0%A0%D0%B5%D0%B3%D0%BB%D0%B0%D0%BC%D0%B5%D0%BD%D1%82%20%D0%92%D0%A5%20%D0%A0%D0%A2.docx" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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

const OPENDATA_SLUG = "opendata";
const OPENDATA_TITLE = "Открытые данные";
const OPENDATA_HTML = `
    
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
        <a href="/upload/iblock/opendata/1701009892-maininfo.csv" target="_blank" rel="noreferrer" style="color: #003366; text-decoration: underline;">
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
      src="/images/%D0%B0%D0%B4%D1%8B%D0%B3%D0%B1%D0%B0%D0%B9.jpg"
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
        <li><a href="/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A7%20%D0%B7%D0%B0%202022%20%D0%B3..pdf" target="_blank" rel="noreferrer" style="color: #003366;">Доклад Уполномоченного по правам человека в Республике Тыва за 2022 год (PDF)</a></li>
        <li><a href="/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%B7%D0%B0%202021%20%D0%B3%D0%BE%D0%B4.docx" target="_blank" rel="noreferrer" style="color: #003366;">����������оклад Уполномоченного по правам человека в Республике Тыва за 2021 год (DOCX)</a></li>
        <li><a href="/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%90%D0%B4%D1%8B%D0%B3%D0%B1%D0%B0%D0%B9%20%D0%90.%D0%9C.%20%D0%B7%D0%B0%202024%20%D0%B3%D0%BE%D0%B4.pdf" target="_blank" rel="noreferrer" style="color: #003366;">Доклад Уполномоченного по правам человека в Республике Тыва за 2024 год (PDF)</a></li>
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
      <li><a href="/docs/%D0%94%D0%BE%D0%BA%D0%BB%D0%B0%D0%B4%20%D0%A3%D0%9F%D0%A0%20%D0%B7%D0%B0%202024%20%D0%B3.,%20%D0%BE%D0%BA%D0%BE%D0%BD%D1%87..docx" target="_blank" rel="noreferrer">Доклад о деятельности уполномоченного по правам ребенка в Республике Тыве за 2024 год (DOCX)</a></li>
    </ul>
  </div>
</div>
`;

// === Полномочия Председателя ===
const INFO_POLNOMOCHIYA_SPEAKER_SLUG = "info/polnomochiya-spikera";
const INFO_POLNOMOCHIYA_SPEAKER_TITLE = "Полномочия Председателя";
const INFO_POLNOMOCHIYA_SPEAKER_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; line-height: 1.8; color: #1f2937;">
    <h1 style="margin:0 0 20px 0; font-size: 22px; font-weight: 700; color: #111827;">Полномочия Председателя</h1>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">1. Председатель Верховного Хурала:</h2>
    <ol style="margin:0 0 16px 0; padding-left: 24px;">
      <li style="margin-bottom:8px;">представляет Верховный Хурал во взаимоотношениях с федеральными органами государственной власти, органами государственной власти Республики Тыва и других субъектов Российской Федерации, органами местного самоуправления муниципальных образований Республики Тыва, иными государственными органами, общественными объединениями, организациями и гражданами, с иностранными партнерами, а также в межпарламентских связях;</li>
      <li style="margin-bottom:8px;">обеспечивает взаимодействие Верховного Хурала во взаимоотношениях с федеральными органами государственной власти — Президентом Российской Федерации (в том числе через его полномочных представителей), Государственной Думой и Советом Федерации Федерального Собрания Российской Федерации, депутатами Государственной Думы и членами Совета Федерации Федерального Собрания Российской Федерации, Конституционным Судом Российской Федерации, Верховным Судом Российской Федерации, Высшим Арбитражным Судом Российской Федерации, а также иными федеральными государственными органами и их должностными лицами;</li>
      <li style="margin-bottom:8px;">обеспечивает взаимодействие Верховного Хурала с Главой Республики Тыва и Правительством Республики Тыва, иными государственными органами Республики Тыва, органами местного самоуправления муниципальных образований Республики Тыва.</li>
    </ol>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">2. Председатель Верховного Хурала, осуществляя общее руководство деятельностью Верховного Хурала:</h2>
    <ol style="margin:0 0 16px 0; padding-left: 24px;">
      <li style="margin-bottom:8px;">обеспечивает общую координацию деятельности комитетов, комиссий и рабочих групп Верховного Хурала;</li>
      <li style="margin-bottom:8px;">осуществляет руководство подготовкой заседаний Верховного Хурала и вопросов, выносимых на рассмотрение заседаний Верховного Хурала; созывает заседания Верховного Хурала;</li>
      <li style="margin-bottom:8px;">председательствует на заседаниях Верховного Хурала;</li>
      <li style="margin-bottom:8px;">организует работу Совета Верховного Хурала и председательствует на его заседаниях;</li>
      <li style="margin-bottom:8px;">издает распоряжения и дает поручения по вопросам, отнесенным к его компетенции;</li>
      <li style="margin-bottom:8px;">подписывает постановления, протоколы заседаний, обращения, заявления, декларации и иные документы Верховного Хурала;</li>
      <li style="margin-bottom:8px;">направляет Главе Республики Тыва для подписания и обнародования конституционные законы Республики Тыва, законы Республики Тыва, принятые Верховным Хуралом;</li>
      <li style="margin-bottom:8px;">дает поручения заместителю Председателя Верховного Хурала, председателям постоянных комитетов Верховного Хурала, иных рабочих органов Верховного Хурала; контролирует исполнение указанных поручений;</li>
      <li style="margin-bottom:8px;">оказывает содействие депутатам Верховного Хурала в осуществлении ими своих полномочий.</li>
    </ol>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">3. Председатель Верховного Хурала в целях реализации Верховным Хуралом прав юридического лица и органа государственной власти:</h2>
    <ol style="margin:0 0 16px 0; padding-left: 24px;">
      <li style="margin-bottom:8px;">распоряжается финансовыми средствами, предусмотренными в республиканском бюджете на содержание и деятельность Верховного Хурала;</li>
      <li style="margin-bottom:8px;">заключает государственные контракты и договоры;</li>
      <li style="margin-bottom:8px;">представляет интересы Верховного Хурала в судах; подписывает от его имени обращения (заявления) в суды; выдает доверенности на ведение дел в судебных органах;</li>
      <li style="margin-bottom:8px;">осуществляет иные полномочия, связанные с реализацией Верховным Хуралом прав юридического лица.</li>
    </ol>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">4. Председатель Верховного Хурала, осуществляя общее руководство организацией и деятельностью Аппарата Верховного Хурала:</h2>
    <ol style="margin:0 0 16px 0; padding-left: 24px;">
      <li style="margin-bottom:8px;">утверждает штатное расписание Аппарата Верховного Хурала;</li>
      <li style="margin-bottom:8px;">назначает на должность и освобождает от должности руководителя Аппарата Верховного Хурала, производит назначение на иные должности государственной гражданской службы Республики Тыва в Аппарате Верховного Хурала и увольнение с указанных должностей; ведает вопросами приема на работу работников на должности в Аппарате Верховного Хурала, не отнесенные к должностям государственной гражданской службы Республики Тыва, и их увольнения;</li>
      <li style="margin-bottom:8px;">ведает вопросами поощрения и привлечения к дисциплинарной ответственности государственных гражданских служащих Республики Тыва Аппарата Верховного Хурала и других работников Аппарата Верховного Хурала;</li>
      <li style="margin-bottom:8px;">ведает иными вопросами внутреннего распорядка Верховного Хурала.</li>
    </ol>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">5. Председатель Верховного Хурала осуществляет иные полномочия, возложенные на него федеральными законами, Конституцией Республики Тыва, законами Республики Тыва, настоящим Регламентом.</h2>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">6. Председатель Верховного Хурала вправе делегировать часть своих полномочий по вопросам организации работы депутатов, комитетов, комиссий Верховного Хурала, а также представительских функций заместителю Председателя Верховного Хурала, а по вопросам организации работы Аппарата Верховного Хурала, материально-технического, финансового и правового обеспечения — руководителю Аппарата Верховного Хурала.</h2>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">7. Верховный Хурал вправе отменить любое распоряжение, поручение Председателя Верховного Хурала, заместителя Председателя Верховного Хурала в случае их противоречия законодательству Российской Федерации и Республики Тыва, а также настоящему Регламенту.</h2>
  </div>
</div>
`;

// === Противодействие коррупции ===
const INFO_CORRUPTION_SLUG = "info/protivodeystvie-korrupcii";
const INFO_CORRUPTION_TITLE = "Противодействие коррупции";
const INFO_CORRUPTION_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px; line-height: 1.8;">
    <h1 style="margin:0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">Противодействие коррупции</h1>
    <p style="margin:0 0 16px 0; font-size: 14px; color: #6b7280;">Уважаемые посетители сайта! При выборе федеральных нормативных правовых актов осуществляется переход на официальный интернет-портал правовой информации (www.pravo.gov.ru), где действующие федеральные законы, указы Президента Российской Федерации и постановления Правительства Российской Федерации содержатся в актуальном состоянии.</p>
    <ul style="margin:0; padding-left: 20px;">
      <li><a href="/${INFO_CORRUPTION_SLUG}/normativnye-akty" style="color: #003366;">Нормативные правовые и иные акты в сфере противодействия коррупции</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/komissiya-deputatov" style="color: #003366;">Комиссия по контролю за достоверностью сведений, представляемых депутатами</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/metodicheskie-materialy" style="color: #003366;">Методические материалы</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/obratnaya-svyaz" style="color: #003366;">Обратная связь для сообщений о фактах коррупции</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/formy-dokumentov" style="color: #003366;">Формы документов, связанных с противодействием коррупции</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/spavki-bk" style="color: #003366;">Специальное программное обеспечение «Справки БК»</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/protivodeystvie-korrupcii-plan" style="color: #003366;">План противодействия коррупции</a></li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_NORMATIVERNIE_SLUG = "info/protivodeystvie-korrupcii/normativnye-akty";
const INFO_CORRUPTION_NORMATIVERNIE_TITLE = "Нормативные правовые и иные акты в сфере противодействия коррупции";
const INFO_CORRUPTION_NORMATIVERNIE_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Нормативные правовые и иные акты в сфере противодействия коррупции</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li style="margin-bottom:8px;"><strong>Федеральные законы</strong></li>
      <li style="margin-bottom:8px;"><strong>Указы Президента Российской Федерации</strong></li>
      <li style="margin-bottom:8px;"><strong>Постановления Правительства Российской Федерации</strong></li>
      <li style="margin-bottom:8px;"><strong>Законы Республики Тыва</strong></li>
      <li><strong>План мероприятий по противодействию коррупции</strong></li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_SLUG = "info/protivodeystvie-korrupcii/komissiya-deputatov";
const INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_TITLE = "Комиссия по контролю за достоверностью сведений, представляемых депутатами";
const INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Комиссия по контролю за достоверностью сведений, представляемых депутатами</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li style="margin-bottom:8px;"><a href="/${INFO_CORRUPTION_SLUG}/komissiya-deputatov/vypiski-protokoly" style="color: #003366;">Выписки, протокола, решения</a></li>
      <li><a href="/${INFO_CORRUPTION_SLUG}/komissiya-deputatov/informatsiya" style="color: #003366;">Информация о деятельности Комиссии Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений, представляемых депутатами Верховного Хурала (парламента) Республики Тыва</a></li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_KOMISSIYA_VYPISKI_SLUG = "info/protivodeystvie-korrupcii/komissiya-deputatov/vypiski-protokoly";
const INFO_CORRUPTION_KOMISSIYA_VYPISKI_TITLE = "Выписки, протокола, решения";
const INFO_CORRUPTION_KOMISSIYA_VYPISKI_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Выписки, протокола, решения</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_SLUG = "info/protivodeystvie-korrupcii/komissiya-deputatov/informatsiya";
const INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_TITLE = "Информация о деятельности Комиссии";
const INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Информация о деятельности Комиссии Верховного Хурала (парламента) Республики Тыва по контролю за достоверностью сведений, представляемых депутатами</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_CORRUPTION_METODICHESKIE_SLUG = "info/protivodeystvie-korrupcii/metodicheskie-materialy";
const INFO_CORRUPTION_METODICHESKIE_TITLE = "Методические материалы";
const INFO_CORRUPTION_METODICHESKIE_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Методические материалы</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li style="margin-bottom:8px;">Методические материалы, одобренные президиумом Совета при Президенте РФ по противодействию коррупции</li>
      <li>Методические рекомендации, обзоры, разъяснения и иные документы, подготовленные Минтрудом России и Минздравсоцразвития России</li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_OBRATNAYA_SVYAZ_SLUG = "info/protivodeystvie-korrupcii/obratnaya-svyaz";
const INFO_CORRUPTION_OBRATNAYA_SVYAZ_TITLE = "Обратная связь для сообщений о фактах коррупции";
const INFO_CORRUPTION_OBRATNAYA_SVYAZ_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px; line-height: 1.8; color: #1f2937;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Обратная связь для сообщений о фактах коррупции</h1>
    <p style="margin:0 0 16px 0;">Уважаемые посетители сайта!</p>
    <p style="margin:0 0 16px 0;">Если Вы располагаете сведениями о коррупционных правонарушениях, неправомерных и противоправных действиях, о некорректном поведении лиц, замещающих государственные должности Республики Тыва и государственных гражданских служащих Республики Тыва, Вы можете сообщить об этом следующими способами:</p>
    <ul style="margin:0; padding-left: 24px;">
      <li style="margin-bottom:8px;">по телефону начальника отдела кадров и государственной службы управления делами Аппарата Верховного Хурала (парламента) Республики Тыва (39422)-21229;</li>
      <li style="margin-bottom:8px;">через раздел «интернет-приемная» официального сайта Верховного Хурала (парламента) Республики Тыва;</li>
      <li style="margin-bottom:8px;">отправив электронное письмо в приемную Председателя Верховного Хурала (парламента) Республики Тыва адресу: <a href="mailto:khural@inbox.ru" style="color: #003366;">khural@inbox.ru</a>;</li>
      <li>отправив письмо почтой по адресу: 667000, Республика Тыва, г. Кызыл, ул. Ленина, 32.</li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_FORMY_DOKUMENTOV_SLUG = "info/protivodeystvie-korrupcii/formy-dokumentov";
const INFO_CORRUPTION_FORMY_DOKUMENTOV_TITLE = "Формы документов, связанных с противодействием коррупции";
const INFO_CORRUPTION_FORMY_DOKUMENTOV_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Формы документов, связанных с противодействием коррупции</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li style="margin-bottom:8px;"><a href="/upload/docs/188/1.docx" target="_blank" rel="noreferrer" style="color: #003366;">Форма справки о доходах, расходах, имуществе и обязательствах имущественного характера <span style="color: #6b7280;">(139 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/188/2.docx" target="_blank" rel="noreferrer" style="color: #003366;">Форма обращения гражданина, юридического лица по фактам коррупционных правонарушений <span style="color: #6b7280;">(28.5 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/188/3.docx" target="_blank" rel="noreferrer" style="color: #003366;">Форма сведений об адресах сайтов и (или) страниц сайтов в информационно-телекоммуникационной сети «Интернет» <span style="color: #6b7280;">(64.5 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/188/4.docx" target="_blank" rel="noreferrer" style="color: #003366;">Форма заявления служащего (работника) о невозможности по объективным причинам представить сведения о доходах, об имуществе и обязательствах имущественного характера своих супруги (супруга) и несовершеннолетних детей <span style="color: #6b7280;">(35.5 КБ)</span></a></li>
      <li style="margin-top: 16px;"><strong>Специальное программное обеспечение для заполнения справки о доходах, об имуществе и обязательствах имущественного характера</strong></li>
      <li><a href="/upload/docs/188/5.docx" target="_blank" rel="noreferrer" style="color: #003366;">Форма уведомления представителя нанимателя (работодате <span style="color: #6b7280;">(скачать)</span></a></li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_SPAVKE_BK_SLUG = "info/protivodeystvie-korrupcii/spavki-bk";
const INFO_CORRUPTION_SPAVKE_BK_TITLE = 'Специальное программное обеспечение "Справки БК"';
const INFO_CORRUPTION_SPAVKE_BK_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Специальное программное обеспечение «Справки БК»</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li style="margin-bottom:8px;"><a href="/upload/docs/185/spavki_bk.exe" target="_blank" rel="noreferrer" style="color: #003366;">СПО Справки БК (версия 2.5.5) от 31.01.2024 <span style="color: #6b7280;">(20139.1 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/185/novely.docx" target="_blank" rel="noreferrer" style="color: #003366;">Основные новеллы <span style="color: #6b7280;">(25.6 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/185/instrukciya.docx" target="_blank" rel="noreferrer" style="color: #003366;">Инструкция о порядке заполнения справок о доходах (в формате doc) <span style="color: #6b7280;">(41.5 КБ)</span></a></li>
      <li style="margin-bottom:8px;"><a href="/upload/docs/185/opisanie.docx" target="_blank" rel="noreferrer" style="color: #003366;">Описание специального программного обеспечения (в формате doc) <span style="color: #6b7280;">(458 КБ)</span></a></li>
      <li><a href="/upload/docs/185/metod_rekomendacii_2025.pdf" target="_blank" rel="noreferrer" style="color: #003366;">МЕТОДИЧЕСКИЕ РЕКОМЕНДАЦИИ в 2025 году (за отчетный 2024 год) <span style="color: #6b7280;">(163.3 КБ)</span></a></li>
    </ul>
  </div>
</div>
`;

const INFO_CORRUPTION_PLAN_SLUG = "info/protivodeystvie-korrupcii/protivodeystvie-korrupcii-plan";
const INFO_CORRUPTION_PLAN_TITLE = "План противодействия коррупции";
const INFO_CORRUPTION_PLAN_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">План противодействия коррупции</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li><a href="/upload/docs/233/protivodeystvie_korrupcii_2018-2020.pdf" target="_blank" rel="noreferrer" style="color: #003366;">План противодействия коррупции в Верховном Хурале (парламенте) Республики Тыва на 2018 – 2020 годы <span style="color: #6b7280;">(105.5 КБ)</span></a></li>
    </ul>
  </div>
</div>
`;

// === Контактная информация ===
const INFO_CONTACTS_SLUG = "info/contacts";
const INFO_CONTACTS_TITLE = "Контактная информация";
const INFO_CONTACTS_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; line-height: 1.8; color: #1f2937;">
    <h1 style="margin:0 0 20px 0; font-size: 22px; font-weight: 700; color: #111827;">Контактная информация</h1>
    
    <div style="margin-bottom: 16px;">
      <strong style="font-size: 16px;">Адрес:</strong><br>
      667000, Республика Тыва, г. Кызыл, ул. Ленина, 32
    </div>
    
    <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 8px;">
      <strong style="font-size: 16px;">Приемная</strong><br>
      тел/факс: <a href="tel:83942221632" style="color: #003366;">8 (39422) 2-16-32</a><br>
      e-mail: <a href="mailto:khural@inbox.ru" style="color: #003366;">khural@inbox.ru</a>
    </div>
    
    <div>
      <strong style="font-size: 16px;">Время работы:</strong><br>
      понедельник - пятница: 8.30 - 17.30<br>
      перерыв на обед: 13.00 - 14.00
    </div>
  </div>
</div>
`;

// === Государственные символы ===
const INFO_GOSIMVOLI_SLUG = "info/gosudarstvennye-simvoly";
const INFO_GOSIMVOLI_TITLE = "Государственные символы Республики Тыва";
const INFO_GOSIMVOLI_HTML = `
<div style="display:grid; gap:16px;">
  <div class="card" style="padding: 20px; line-height: 1.8; color: #1f2937;">
    <h1 style="margin:0 0 20px 0; font-size: 22px; font-weight: 700; color: #111827;">Государственные символы Республики Тыва</h1>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Государственный гимн Республики Тыва</h2>
    <p style="margin:0 0 16px 0;">Принят Верховным Хуралом (парламентом) Республики Тыва 11 августа 2011 года приложением № 2 к конституционному закону Республики Тыва № 828 ВХ-I «О Государственном гимне Республики Тыва».</p>
    <p style="margin:0 0 16px 0;">Утверждён Председателем Правительства Республики Тыва Ш. Кара-оолом 11 августа 2011 года.</p>
    <p style="margin:0 0 16px 0;">Вступил в силу 13 августа 2011 года – в день официального опубликования в газете «Тувинская правда» № 85 от 13 августа 2011 года.</p>
    
    <div style="margin: 20px 0; padding: 16px; background: #f9fafb; border-radius: 8px; line-height: 2;">
      <p style="margin:0 0 8px 0; font-weight: 700; text-align: center;">«Мен – тыва мен»</p>
      <p style="margin:0 0 4px 0; font-style: italic;">Арт-арттың оваазынга<br>Дажын салып чалбарган<br>Таңды, Саян ыдыынга<br>Агын өргээн тыва мен.</p>
      <p style="margin:0 0 4px 0; font-weight: 600;">Кожумаа:</p>
      <p style="margin:0 0 4px 0; font-style: italic;">Мен – тыва мен<br>Мөңге харлыг дагның оглу мен.<br>Мен – тыва мен,<br>Мөңгүн суглуг чурттуң төлу мен.<br>Өгбелерим чуртунда<br>Өлчей тарып иженген,<br>Өткүт хөөмей ырынга<br>Өөрүп талаан тыва мен.</p>
      <p style="margin:0 0 4px 0; font-weight: 600;">Кожумаа:</p>
      <p style="margin:0 0 4px 0; font-style: italic;">Мен – тыва мен,<br>Мөңге харлыг дагның оглу мен.<br>Мен – тыва мен,<br>Мөңгүн суглуг чурттуң төлу мен.</p>
      <p style="margin:0 0 4px 0; font-style: italic;">Аймак чоннар бүлези<br>Акы-дуңма найыралдыг,<br>Депшилгеже чүткүлдүг<br>Демниг чурттуг тыва мен.</p>
      <p style="margin:0 0 4px 0; font-weight: 600;">Кожумаа:</p>
      <p style="margin:0; font-style: italic;">Мен – тыва мен,<br>Мөңге харлыг дагның оглу мен.<br>Мен – тыва мен,<br>Мөңгүн суглуг чурттуң төлу мен.</p>
    </div>
    
    <h2 style="margin:20px 0 12px 0; font-size: 18px; font-weight: 600; color: #111827;">Государственная символика Республики Тыва</h2>
    
    <h3 style="margin:16px 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Герб Республики Тыва</h3>
    <p style="margin:0 0 12px 0;">Изображение на голубом фоне золотого всадника в национальной тувинской одежде, скачущего на золотой лошади навстречу лучам восходящего солнца. В основании герба на традиционной белой ленте «кадак» надпись золотом «Тыва». Обрамление герба имеет пятилепестковую форму.</p>
    <p style="margin:0 0 12px 0;">Скачущий на лошади всадник арат — крестьянин-скотовод отражает самобытность этноса тувинцев, их традиционный уклад жизни и основную хозяйственную деятельность на протяжении многих веков. На всаднике национальные костюм «тон» и головной убор, которые носили далекие предки тувинцев. Не случайно он на коне. Жизнь тувинца-кочевника немыслима без него. Конь давал высококалорийную пищу — мясо и кумыс; одежду, обувь, веревки, арканы, нити; служил основным транспортным средством, в случае военных столкновений был боевым другом своего хозяина.</p>
    <p style="margin:0 0 12px 0;">Изображение всадника — арата, скачущего навстречу золотым лучам солнца, символизирует движение к светлой и счастливой жизни, миру, высоким идеалам. Лента «кадак» — церемониальный шарф, подносится как почетный дар, а также выражает гостеприимство и дружелюбие тувинцев. Пятилепестковое обрамление, придающее гербу неповторимую форму, — стилизованный древнебуддийский знак вечности.</p>
    
    <h3 style="margin:16px 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Флаг Республики Тыва</h3>
    <p style="margin:0 0 12px 0;">Голубое прямоугольное полотнище с наклонными белыми и голубыми полосами, исходящими из верхнего и нижнего углов со стороны древка. Голубые полосы соединяются в одну, проходящую посередине флага. Треугольник, образованный белыми полосами на левом крае флага, имеет золотой цвет. Соотношение сторон флага — 1:2.</p>
    <p style="margin:0 0 12px 0;">Исходящие из верхнего и нижнего углов флага полосы символизируют протекающие по территории Тывы реки Большой Енисей (Бий-Хем) и Малый Енисей (Каа-Хем), а образуемая ими полоса, идущая вдоль полотнища флага, — Верхний Енисей (Улуг-Хем). Этот последний — результат слияния двух первых в месте нахождения Кызыла.</p>
    <p style="margin:0 0 12px 0;">О цветовом ряде символов. Золотой символизирует богатство, верховенство, величие; голубой — чистое небо, возвышенность целей, взаимоуважение и согласие в обществе; белый — чистоту и благородство общественной морали, он также напоминает о традиционном напитке тувинцев — чае с молоком, который первым делом преподносят гостю, когда он входит в дом.</p>
    
    <h3 style="margin:16px 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Государственный Герб Российской Федерации</h3>
    <p style="margin:0 0 8px 0;"><a href="http://www.gov.ru/main/symbols/gsrf2_1.html" target="_blank" rel="noreferrer" style="color: #003366;">Федеральный конституционный закон «О Государственном гербе Российской Федерации»</a></p>
    
    <h3 style="margin:16px 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Государственный Флаг Российской Федерации</h3>
    <p style="margin:0 0 8px 0;"><a href="http://www.gov.ru/main/symbols/gsrf3_1.html" target="_blank" rel="noreferrer" style="color: #003366;">Федеральный конституционный закон «О Государственном флаге Российской Федерации»</a></p>
    
    <h3 style="margin:16px 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">Государственный Гимн Российской Федерации</h3>
    <ul style="margin:0; padding-left: 20px;">
      <li><a href="http://www.gov.ru/main/symbols/gsrf4_1.html" target="_blank" rel="noreferrer" style="color: #003366;">Федеральный конституционный закон «О Государственном гимне Российской Федерации»</a></li>
      <li><a href="http://www.gov.ru/main/symbols/gsrf4_4.html" target="_blank" rel="noreferrer" style="color: #003366;">Текст Государственного гимна Российской Федерации</a></li>
      <li><a href="http://www.gov.ru/main/symbols/gsrf4_5.html" target="_blank" rel="noreferrer" style="color: #003366;">Исполнение Государственного гимна Российской Федерации</a></li>
    </ul>
  </div>
</div>
`;

// === Приграничный субъект ===
const INFO_GRANISA_SLUG = "info/prigranichny-subekt";
const INFO_GRANISA_TITLE = "Приграничный субъект";
const INFO_GRANISA_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px; line-height: 1.8;">
    <h1 style="margin:0 0 16px 0; font-size: 22px; font-weight: 700; color: #111827;">Приграничный субъект</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li><a href="/${INFO_GRANISA_SLUG}/shablony" style="color: #003366;">Шаблоны заявлений и ходатайств</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/shema-uslugi" style="color: #003366;">Схема предоставления услуги</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/individualny-propusk" style="color: #003366;">Ходатайство на получение индивидуального пропуска для въезда (прохода) лиц и транспортных средств в пограничную зону</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/kollektivny-propusk" style="color: #003366;">Ходатайство на получение коллективного пропуска для въезда (прохода) лиц и транспортных средств в пограничную зону</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/zayavlenie-zakonnogo-predstavitelya" style="color: #003366;">Заявление законного представителя</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/zayavlenie-individualny-propusk" style="color: #003366;">Заявление на индивидуальный пропуск</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/zayavlenie-kollektivny-propusk" style="color: #003366;">Заявление на коллективный пропуск</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/zayavlenie-promyslovaya-deyatelnost" style="color: #003366;">Заявление на промысловую деятельность</a></li>
      <li><a href="/${INFO_GRANISA_SLUG}/zayavlenie-hoz-deyatelnost" style="color: #003366;">Заявление на разрешение хоз. деятельности</a></li>
    </ul>
  </div>
</div>
`;

const INFO_GRANISA_SHABLONY_SLUG = "info/prigranichny-subekt/shablony";
const INFO_GRANISA_SHABLONY_TITLE = "Шаблоны заявлений и ходатайств";
const INFO_GRANISA_SHABLONY_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Шаблоны заявлений и ходатайств</h1>
    <ul style="margin:0; padding-left: 20px;">
      <li><a href="/info/granisa/205/" target="_blank" rel="noreferrer" style="color: #003366;">Ходатайство на получение индивидуального пропуска</a></li>
      <li><a href="/info/granisa/206/" target="_blank" rel="noreferrer" style="color: #003366;">Ходатайство на получение коллективного пропуска</a></li>
      <li><a href="/info/granisa/207/" target="_blank" rel="noreferrer" style="color: #003366;">Заявление законного представителя</a></li>
      <li><a href="/info/granisa/208/" target="_blank" rel="noreferrer" style="color: #003366;">Заявление на индивидуальный пропуск</a></li>
      <li><a href="/info/granisa/209/" target="_blank" rel="noreferrer" style="color: #003366;">Заявление на коллективный пропуск</a></li>
      <li><a href="/info/granisa/210/" target="_blank" rel="noreferrer" style="color: #003366;">Заявление на промысловую деятельность</a></li>
      <li><a href="/info/granisa/211/" target="_blank" rel="noreferrer" style="color: #003366;">Заявление на разрешение хоз. деятельности</a></li>
    </ul>
  </div>
</div>
`;

const INFO_GRANISA_SHema_SLUG = "info/prigranichny-subekt/shema-uslugi";
const INFO_GRANISA_SHema_TITLE = "Схема предоставления услуги";
const INFO_GRANISA_SHema_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Схема предоставления услуги</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_INDIV_PROPUSK_SLUG = "info/prigranichny-subekt/individualny-propusk";
const INFO_GRANISA_INDIV_PROPUSK_TITLE = "Ходатайство на получение индивидуального пропуска";
const INFO_GRANISA_INDIV_PROPUSK_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Ходатайство на получение индивидуального пропуска для въезда (прохода) лиц и транспортных средств в пограничную зону</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_KOL_PROPUSK_SLUG = "info/prigranichny-subekt/kollektivny-propusk";
const INFO_GRANISA_KOL_PROPUSK_TITLE = "Ходатайство на получение коллективного пропуска";
const INFO_GRANISA_KOL_PROPUSK_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Ходатайство на получение коллективного пропуска для въезда (прохода) лиц и транспортных средств в пограничную зону</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_ZAYAVLENIE_ZAKON_SLUG = "info/prigranichny-subekt/zayavlenie-zakonnogo-predstavitelya";
const INFO_GRANISA_ZAYAVLENIE_ZAKON_TITLE = "Заявление законного представителя";
const INFO_GRANISA_ZAYAVLENIE_ZAKON_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Заявление законного представителя</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_ZAYAVLENIE_INDIV_SLUG = "info/prigranichny-subekt/zayavlenie-individualny-propusk";
const INFO_GRANISA_ZAYAVLENIE_INDIV_TITLE = "Заявление на индивидуальный пропуск";
const INFO_GRANISA_ZAYAVLENIE_INDIV_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Заявление на индивидуальный пропуск</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_ZAYAVLENIE_KOL_SLUG = "info/prigranichny-subekt/zayavlenie-kollektivny-propusk";
const INFO_GRANISA_ZAYAVLENIE_KOL_TITLE = "Заявление на коллективный пропуск";
const INFO_GRANISA_ZAYAVLENIE_KOL_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Заявление на коллективный пропуск</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_SLUG = "info/prigranichny-subekt/zayavlenie-promyslovaya-deyatelnost";
const INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_TITLE = "Заявление на промысловую деятельность";
const INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Заявление на промысловую деятельность</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
  </div>
</div>
`;

const INFO_GRANISA_ZAYAVLENIE_HOZ_SLUG = "info/prigranichny-subekt/zayavlenie-hoz-deyatelnost";
const INFO_GRANISA_ZAYAVLENIE_HOZ_TITLE = "Заявление на разрешение хоз. деятельности";
const INFO_GRANISA_ZAYAVLENIE_HOZ_HTML = `
<div style="display:grid; gap:12px;">
  <div class="card" style="padding: 20px;">
    <h1 style="margin:0 0 16px 0; font-size: 20px; font-weight: 700; color: #111827;">Заявление на разрешение хоз. деятельности</h1>
    <p style="margin:0;">Сведения отсутствуют.</p>
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

// Псевдонимы слагов вынесены в utils/slugAliases.js — общий источник для
// страницы и бокового меню (SideNav), чтобы алиасы давали одинаковый контент и меню.

export default function PageBySlug() {
  const { lang, t } = useI18n();
  const adminData = useAdminData();
  const [slug, setSlug] = React.useState(() => normalizeSlugAlias(getSlugFromPath()));
  const [page, setPage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [docPreview, setDocPreview] = React.useState(null); // { url, title } — предпросмотр PDF из статического HTML

  // Ссылки вида <a data-doc-preview> внутри статического HTML открываем в модалке, а не переходом.
  const onHtmlContentClick = React.useCallback((e) => {
    const link = e.target?.closest?.("a[data-doc-preview]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    e.preventDefault();
    setDocPreview({
      url: href,
      title: link.getAttribute("data-doc-title") || link.textContent,
    });
  }, []);

  React.useEffect(() => {
    const update = () => setSlug(normalizeSlugAlias(getSlugFromPath()));
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
      "about/districts",
      INFO_LAWMAP_SLUG,
      INFO_HISTORY_SLUG,
      INFO_POLNOMOCHIYA_SLUG,
      "info/polnomochiya",
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
      INFO_PERSONNEL_VAKANSII_SLUG,
      INFO_PERSONNEL_KONKURSY_SLUG,
      INFO_PERSONNEL_METODIKA_SLUG,
      INFO_PERSONNEL_KOMISSII_SLUG,
      INFO_PERSONNEL_DOKUMENTY_SLUG,
      INFO_PERSONNEL_KONKURSY_PROTOKOL_SLUG,
      INFO_PERSONNEL_KONKURSY_PROTOKOL_1_SLUG,
      INFO_PERSONNEL_KONKURSY_PROTOKOL_2_SLUG,
      INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_SLUG,
      INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_SLUG,
      INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_SLUG,
      INFO_PERSONNEL_KOMISSII_POLOZENIE_SLUG,
      INFO_PERSONNEL_KOMISSII_SOSTAV_SLUG,
      INFO_PERSONNEL_KOMISSII_RESHENIYA_SLUG,
      INFO_CORRUPTION_SLUG,
      INFO_CORRUPTION_NORMATIVERNIE_SLUG,
      INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_SLUG,
      INFO_CORRUPTION_KOMISSIYA_VYPISKI_SLUG,
      INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_SLUG,
      INFO_CORRUPTION_METODICHESKIE_SLUG,
      INFO_CORRUPTION_OBRATNAYA_SVYAZ_SLUG,
      INFO_CORRUPTION_FORMY_DOKUMENTOV_SLUG,
      INFO_CORRUPTION_SPAVKE_BK_SLUG,
      INFO_CORRUPTION_PLAN_SLUG,
      INFO_GRANISA_SLUG,
      INFO_GRANISA_SHABLONY_SLUG,
      INFO_GRANISA_SHema_SLUG,
      INFO_GRANISA_INDIV_PROPUSK_SLUG,
      INFO_GRANISA_KOL_PROPUSK_SLUG,
      INFO_GRANISA_ZAYAVLENIE_ZAKON_SLUG,
      INFO_GRANISA_ZAYAVLENIE_INDIV_SLUG,
      INFO_GRANISA_ZAYAVLENIE_KOL_SLUG,
      INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_SLUG,
      INFO_GRANISA_ZAYAVLENIE_HOZ_SLUG,
      "info/polnomochiya-spikera",
      "info/polnomochiya-speaker",
      "info/speaker-powers",
      "info/contacts",
      "info/upoln-po-reb",
      "info/child-rights",
      "info/symbols",
      "info/gosudarstvennye-simvoly",
      "info/upoln-po-prav",
      "info/border-subject",
      "info/prigranichny-subekt",
      "info/anti-corruption",
      "info/protivodeystvie-korrupcii",
      "about/finances",
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
  const isInfoFinance = slug === INFO_FINANCE_SLUG || slug === "about/finances";
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
  const isInfoPolnomochiya = slug === INFO_POLNOMOCHIYA_SLUG || slug === "info/polnomochiya";
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
  const isInfoPersonnelVakansii = slug === INFO_PERSONNEL_VAKANSII_SLUG;
  const isInfoPersonnelKonkursy = slug === INFO_PERSONNEL_KONKURSY_SLUG;
  const isInfoPersonnelMetodika = slug === INFO_PERSONNEL_METODIKA_SLUG;
  const isInfoPersonnelKomissii = slug === INFO_PERSONNEL_KOMISSII_SLUG;
  const isInfoPersonnelDokumenty = slug === INFO_PERSONNEL_DOKUMENTY_SLUG;
  const isInfoPersonnelKonkursyProtokol = slug === INFO_PERSONNEL_KONKURSY_PROTOKOL_SLUG;
  const isInfoPersonnelKonkursyProtokol1 = slug === INFO_PERSONNEL_KONKURSY_PROTOKOL_1_SLUG;
  const isInfoPersonnelKonkursyProtokol2 = slug === INFO_PERSONNEL_KONKURSY_PROTOKOL_2_SLUG;
  const isInfoPersonnelKonkursyObYavlenie = slug === INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_SLUG;
  const isInfoPersonnelKonkursyObYavlenieKomissii = slug === INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_SLUG;
  const isInfoPersonnelKomissiiRasporyazhenie = slug === INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_SLUG;
  const isInfoPersonnelKomissiiPolozhenie = slug === INFO_PERSONNEL_KOMISSII_POLOZENIE_SLUG;
  const isInfoPersonnelKomissiiSostav = slug === INFO_PERSONNEL_KOMISSII_SOSTAV_SLUG;
  const isInfoPersonnelKomissiiResheniya = slug === INFO_PERSONNEL_KOMISSII_RESHENIYA_SLUG;
  const isInfoPolnomochiyaSpeaker = slug === INFO_POLNOMOCHIYA_SPEAKER_SLUG;
  const isInfoCorruption = slug === INFO_CORRUPTION_SLUG;
  const isInfoCorruptionNormativnye = slug === INFO_CORRUPTION_NORMATIVERNIE_SLUG;
  const isInfoCorruptionKomissiyaDeputatov = slug === INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_SLUG;
  const isInfoCorruptionKomissiyaVypiski = slug === INFO_CORRUPTION_KOMISSIYA_VYPISKI_SLUG;
  const isInfoCorruptionKomissiyaInformaciya = slug === INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_SLUG;
  const isInfoCorruptionMetodicheskie = slug === INFO_CORRUPTION_METODICHESKIE_SLUG;
  const isInfoCorruptionObratnayaSvyaz = slug === INFO_CORRUPTION_OBRATNAYA_SVYAZ_SLUG;
  const isInfoCorruptionFormyDokumentov = slug === INFO_CORRUPTION_FORMY_DOKUMENTOV_SLUG;
  const isInfoCorruptionSpavkeBK = slug === INFO_CORRUPTION_SPAVKE_BK_SLUG;
  const isInfoCorruptionPlan = slug === INFO_CORRUPTION_PLAN_SLUG;
  const isInfoContacts = slug === INFO_CONTACTS_SLUG;
  const isInfoGosimvoli = slug === INFO_GOSIMVOLI_SLUG;
  const isInfoGranisa = slug === INFO_GRANISA_SLUG || slug === "info/border-subject";
  const isInfoGranisaShablony = slug === INFO_GRANISA_SHABLONY_SLUG;
  const isInfoGranisaShema = slug === INFO_GRANISA_SHema_SLUG;
  const isInfoGranisaIndivPropusk = slug === INFO_GRANISA_INDIV_PROPUSK_SLUG;
  const isInfoGranisaKolPropusk = slug === INFO_GRANISA_KOL_PROPUSK_SLUG;
  const isInfoGranisaZayavlenieZakon = slug === INFO_GRANISA_ZAYAVLENIE_ZAKON_SLUG;
  const isInfoGranisaZayavlenieIndiv = slug === INFO_GRANISA_ZAYAVLENIE_INDIV_SLUG;
  const isInfoGranisaZayavlenieKol = slug === INFO_GRANISA_ZAYAVLENIE_KOL_SLUG;
  const isInfoGranisaZayavleniePromyslovaya = slug === INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_SLUG;
  const isInfoGranisaZayavlenieHoz = slug === INFO_GRANISA_ZAYAVLENIE_HOZ_SLUG;

  // Любая подстраница раздела «Кадровое обеспечение», включая страницы из бэкенда
  // (vakansii, konkursy, metodika-konkursa, komissii, dokumenty-pri-postuplenii):
  // «Назад» должен вести к корню раздела, а не к «Общим сведениям» (/info).
  const isInfoPersonnelSub = String(slug || "").startsWith(INFO_PERSONNEL_SLUG + "/");

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
      isInfoPersonnelOtpusk ||
      isInfoPersonnelVakansii ||
      isInfoPersonnelKonkursy ||
      isInfoPersonnelMetodika ||
      isInfoPersonnelKomissii ||
      isInfoPersonnelDokumenty ||
      isInfoPersonnelKonkursyProtokol ||
      isInfoPersonnelKonkursyProtokol1 ||
      isInfoPersonnelKonkursyProtokol2 ||
      isInfoPersonnelKonkursyObYavlenie ||
      isInfoPersonnelKonkursyObYavlenieKomissii ||
      isInfoPersonnelKomissiiRasporyazhenie ||
      isInfoPersonnelKomissiiPolozhenie ||
      isInfoPersonnelKomissiiSostav ||
      isInfoPersonnelKomissiiResheniya ||
      isInfoPolnomochiyaSpeaker ||
      isInfoContacts ||
      isInfoGosimvoli ||
      isInfoCorruption ||
      isInfoCorruptionNormativnye ||
      isInfoCorruptionKomissiyaDeputatov ||
      isInfoCorruptionKomissiyaVypiski ||
      isInfoCorruptionKomissiyaInformaciya ||
      isInfoCorruptionMetodicheskie ||
      isInfoCorruptionObratnayaSvyaz ||
      isInfoCorruptionFormyDokumentov ||
      isInfoCorruptionSpavkeBK ||
      isInfoCorruptionPlan ||
      isInfoGranisa ||
      isInfoGranisaShablony ||
      isInfoGranisaShema ||
      isInfoGranisaIndivPropusk ||
      isInfoGranisaKolPropusk ||
      isInfoGranisaZayavlenieZakon ||
      isInfoGranisaZayavlenieIndiv ||
      isInfoGranisaZayavlenieKol ||
      isInfoGranisaZayavleniePromyslovaya ||
      isInfoGranisaZayavlenieHoz ||
      slug === "info/prigranichny-subekt" ||
      slug === "info/border-subject" ||
      slug === "about/finances");

  const isStaticPage =
    isCodeOfHonor ||
    isMothersCommandments ||
    isForMedia ||
    isFederationCouncil ||
    shouldUseInfoFallback ||
    slug === "about/finances";

  // Определяем, является ли страница разделом "Общие сведения" (/info/*)
  const isInfoSection = isInfoIndex ||
    isInfoFinance || slug === "about/finances" ||
    isInfoGranisa || slug === "info/border-subject" || slug === "info/prigranichny-subekt" ||
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
    isInfoPersonnelOtpusk ||
    isInfoPersonnelVakansii ||
    isInfoPersonnelKonkursy ||
    isInfoPersonnelMetodika ||
    isInfoPersonnelKomissii ||
    isInfoPersonnelDokumenty ||
    isInfoPersonnelKonkursyProtokol ||
    isInfoPersonnelKonkursyProtokol1 ||
    isInfoPersonnelKonkursyProtokol2 ||
    isInfoPersonnelKonkursyObYavlenie ||
    isInfoPersonnelKonkursyObYavlenieKomissii ||
    isInfoPersonnelKomissiiRasporyazhenie ||
    isInfoPersonnelKomissiiPolozhenie ||
    isInfoPersonnelKomissiiSostav ||
    isInfoPersonnelKomissiiResheniya ||
    isInfoPolnomochiyaSpeaker ||
    isInfoCorruption ||
    isInfoCorruptionNormativnye ||
    isInfoCorruptionKomissiyaDeputatov ||
    isInfoCorruptionKomissiyaVypiski ||
    isInfoCorruptionKomissiyaInformaciya ||
    isInfoCorruptionMetodicheskie ||
    isInfoCorruptionObratnayaSvyaz ||
    isInfoCorruptionFormyDokumentov ||
    isInfoCorruptionSpavkeBK ||
    isInfoCorruptionPlan ||
    isInfoContacts ||
    isInfoGosimvoli ||
    (isInfoGranisa || slug === "info/border-subject" || slug === "info/prigranichny-subekt") || 
    isInfoGranisaShablony ||
    isInfoGranisaShema ||
    isInfoGranisaIndivPropusk ||
    isInfoGranisaKolPropusk ||
    isInfoGranisaZayavlenieZakon ||
    isInfoGranisaZayavlenieIndiv ||
    isInfoGranisaZayavlenieKol ||
    isInfoGranisaZayavleniePromyslovaya ||
    isInfoGranisaZayavlenieHoz;

  // Подстраницы «Противодействие коррупции» — назад к списку коррупционных разделов
  const isInfoCorruptionSub = isInfoCorruptionNormativnye || isInfoCorruptionKomissiyaDeputatov ||
    isInfoCorruptionKomissiyaVypiski || isInfoCorruptionKomissiyaInformaciya ||
    isInfoCorruptionMetodicheskie || isInfoCorruptionObratnayaSvyaz ||
    isInfoCorruptionFormyDokumentov || isInfoCorruptionSpavkeBK || isInfoCorruptionPlan;
  // Подстраницы «Приграничный субъект» — назад к списку документов
  const isInfoGranisaSub = isInfoGranisaShablony || isInfoGranisaShema || isInfoGranisaIndivPropusk ||
    isInfoGranisaKolPropusk || isInfoGranisaZayavlenieZakon || isInfoGranisaZayavlenieIndiv ||
    isInfoGranisaZayavlenieKol || isInfoGranisaZayavleniePromyslovaya || isInfoGranisaZayavlenieHoz;

  // Подстраницы «Результатов проведения конкурсов» — назад к списку конкурсов
  const isInfoPersonnelKonkursySub = isInfoPersonnelKonkursyProtokol || isInfoPersonnelKonkursyProtokol1 ||
    isInfoPersonnelKonkursyProtokol2 || isInfoPersonnelKonkursyObYavlenie || isInfoPersonnelKonkursyObYavlenieKomissii;
  // Подстраницы «Комиссий» — назад к списку комиссий
  const isInfoPersonnelKomissiiSub = isInfoPersonnelKomissiiRasporyazhenie || isInfoPersonnelKomissiiPolozhenie ||
    isInfoPersonnelKomissiiSostav || isInfoPersonnelKomissiiResheniya;

  // Определяем URL для кнопки "Назад"
  const backUrl = isInfoFinanceChecks2016 || isInfoFinanceChecks2018 || isInfoFinanceChecks2019 || isInfoFinanceChecks2020
    ? "/info/finansy/rezultaty-proverok"
    : isInfoFinanceReports2015 || isInfoFinanceReports2016 || isInfoFinanceReports2017 ||
      isInfoFinanceReports2018 || isInfoFinanceReports2019 || isInfoFinanceReports2020 ||
      isInfoFinanceReports2021 || isInfoFinanceReports2022 || isInfoFinanceReports2023
    ? "/info/finansy/otcheti"
    : isInfoFinanceChecks || isInfoFinanceProcurement || isInfoFinanceReports || isInfoBudget
    ? "/info/finansy"
    : isInfoHistory || isInfoPolnomochiya
    ? "/about"
    : isInfoDistricts || isInfoLawmap || isOpenData ||
      isInfoOmbHuman || isInfoOmbChild
    ? "/info"
    : isInfoPersonnelKonkursySub
    ? "/" + INFO_PERSONNEL_KONKURSY_SLUG
    : isInfoPersonnelKomissiiSub
    ? "/" + INFO_PERSONNEL_KOMISSII_SLUG
    : isInfoPersonnelSub
    ? PERSONNEL_ROOT_PATH
    : isInfoPersonnelVakansii || isInfoPersonnelKonkursy || isInfoPersonnelMetodika || isInfoPersonnelKomissii || isInfoPersonnelDokumenty
    ? PERSONNEL_ROOT_PATH
    : isInfoCorruptionSub
    ? "/" + INFO_CORRUPTION_SLUG
    : isInfoGranisaSub
    ? "/" + INFO_GRANISA_SLUG
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
    : isInfoHistory || isInfoPolnomochiya
    ? t("← Назад к сведениям о Хурале")
    : isInfoDistricts || isInfoLawmap || isOpenData ||
      isInfoOmbHuman || isInfoOmbChild
    ? t("← Назад к информации")
    : isInfoPersonnelKomissiiSub
    ? t("← Назад к комиссиям")
    : isInfoPersonnelKonkursySub
    ? t("← Назад к результатам конкурсов")
    : isInfoCorruptionSub
    ? t("← Назад к противодействию коррупции")
    : isInfoGranisaSub
    ? t("← Назад к приграничному субъекту")
    : isInfoPersonnelSub
    ? t("← Назад к кадровому обеспечению")
    : isInfoPersonnelVakansii || isInfoPersonnelKonkursy || isInfoPersonnelMetodika || isInfoPersonnelKomissii || isInfoPersonnelDokumenty
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
              : isInfoFinance || slug === "about/finances"
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
                                      : isInfoPolnomochiyaSpeaker
                                        ? t(INFO_POLNOMOCHIYA_SPEAKER_TITLE) || INFO_POLNOMOCHIYA_SPEAKER_TITLE
                                        : isInfoCorruption
                                          ? t(INFO_CORRUPTION_TITLE) || INFO_CORRUPTION_TITLE
                                          : isInfoCorruptionNormativnye
                                            ? t(INFO_CORRUPTION_NORMATIVERNIE_TITLE) || INFO_CORRUPTION_NORMATIVERNIE_TITLE
                                            : isInfoCorruptionKomissiyaDeputatov
                                              ? t(INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_TITLE) || INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_TITLE
                                              : isInfoCorruptionKomissiyaVypiski
                                                ? t(INFO_CORRUPTION_KOMISSIYA_VYPISKI_TITLE) || INFO_CORRUPTION_KOMISSIYA_VYPISKI_TITLE
                                                : isInfoCorruptionKomissiyaInformaciya
                                                  ? t(INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_TITLE) || INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_TITLE
                                                  : isInfoCorruptionMetodicheskie
                                                    ? t(INFO_CORRUPTION_METODICHESKIE_TITLE) || INFO_CORRUPTION_METODICHESKIE_TITLE
                                                    : isInfoCorruptionObratnayaSvyaz
                                                      ? t(INFO_CORRUPTION_OBRATNAYA_SVYAZ_TITLE) || INFO_CORRUPTION_OBRATNAYA_SVYAZ_TITLE
                                                      : isInfoCorruptionFormyDokumentov
                                                        ? t(INFO_CORRUPTION_FORMY_DOKUMENTOV_TITLE) || INFO_CORRUPTION_FORMY_DOKUMENTOV_TITLE
                                                        : isInfoCorruptionSpavkeBK
                                                          ? t(INFO_CORRUPTION_SPAVKE_BK_TITLE) || INFO_CORRUPTION_SPAVKE_BK_TITLE
                                                          : isInfoCorruptionPlan
                                                            ? t(INFO_CORRUPTION_PLAN_TITLE) || INFO_CORRUPTION_PLAN_TITLE
                                                            : isInfoContacts
                                                              ? t(INFO_CONTACTS_TITLE) || INFO_CONTACTS_TITLE
                                                              : isInfoGosimvoli
                                                                ? t(INFO_GOSIMVOLI_TITLE) || INFO_GOSIMVOLI_TITLE
                                                                : (isInfoGranisa || slug === "info/border-subject")
                                                                  ? t(INFO_GRANISA_TITLE) || INFO_GRANISA_TITLE
                                                                  : isInfoGranisaShablony
                                                                    ? t(INFO_GRANISA_SHABLONY_TITLE) || INFO_GRANISA_SHABLONY_TITLE
                                                                    : isInfoGranisaShema
                                                                      ? t(INFO_GRANISA_SHema_TITLE) || INFO_GRANISA_SHema_TITLE
                                                                      : isInfoGranisaIndivPropusk
                                                                        ? t(INFO_GRANISA_INDIV_PROPUSK_TITLE) || INFO_GRANISA_INDIV_PROPUSK_TITLE
                                                                        : isInfoGranisaKolPropusk
                                                                          ? t(INFO_GRANISA_KOL_PROPUSK_TITLE) || INFO_GRANISA_KOL_PROPUSK_TITLE
                                                                          : isInfoGranisaZayavlenieZakon
                                                                            ? t(INFO_GRANISA_ZAYAVLENIE_ZAKON_TITLE) || INFO_GRANISA_ZAYAVLENIE_ZAKON_TITLE
                                                                            : isInfoGranisaZayavlenieIndiv
                                                                              ? t(INFO_GRANISA_ZAYAVLENIE_INDIV_TITLE) || INFO_GRANISA_ZAYAVLENIE_INDIV_TITLE
                                                                              : isInfoGranisaZayavlenieKol
                                                                                ? t(INFO_GRANISA_ZAYAVLENIE_KOL_TITLE) || INFO_GRANISA_ZAYAVLENIE_KOL_TITLE
                                                                                : isInfoGranisaZayavleniePromyslovaya
                                                                                  ? t(INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_TITLE) || INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_TITLE
                                                                                  : isInfoGranisaZayavlenieHoz
                                                                                    ? t(INFO_GRANISA_ZAYAVLENIE_HOZ_TITLE) || INFO_GRANISA_ZAYAVLENIE_HOZ_TITLE
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
                                                         : isInfoPersonnelVakansii
                                                           ? t(INFO_PERSONNEL_VAKANSII_TITLE) || INFO_PERSONNEL_VAKANSII_TITLE
                                                           : isInfoPersonnelKonkursy
                                                             ? t(INFO_PERSONNEL_KONKURSY_TITLE) || INFO_PERSONNEL_KONKURSY_TITLE
                                                             : isInfoPersonnelMetodika
                                                               ? t(INFO_PERSONNEL_METODIKA_TITLE) || INFO_PERSONNEL_METODIKA_TITLE
                                                               : isInfoPersonnelKomissii
                                                                 ? t(INFO_PERSONNEL_KOMISSII_TITLE) || INFO_PERSONNEL_KOMISSII_TITLE
                                                                  : isInfoPersonnelDokumenty
                                                                    ? t(INFO_PERSONNEL_DOKUMENTY_TITLE) || INFO_PERSONNEL_DOKUMENTY_TITLE
                                                                    : isInfoPersonnelKonkursyProtokol
                                                                      ? t(INFO_PERSONNEL_KONKURSY_PROTOKOL_TITLE) || INFO_PERSONNEL_KONKURSY_PROTOKOL_TITLE
                                                                      : isInfoPersonnelKonkursyProtokol1
                                                                        ? t(INFO_PERSONNEL_KONKURSY_PROTOKOL_1_TITLE) || INFO_PERSONNEL_KONKURSY_PROTOKOL_1_TITLE
                                                                        : isInfoPersonnelKonkursyProtokol2
                                                                          ? t(INFO_PERSONNEL_KONKURSY_PROTOKOL_2_TITLE) || INFO_PERSONNEL_KONKURSY_PROTOKOL_2_TITLE
                                                                          : isInfoPersonnelKonkursyObYavlenie
                                                                            ? t(INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_TITLE) || INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_TITLE
                                                                            : isInfoPersonnelKonkursyObYavlenieKomissii
                                                                              ? t(INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_TITLE) || INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_TITLE
                                                                              : isInfoPersonnelKomissiiRasporyazhenie
                                                                                ? t(INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_TITLE) || INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_TITLE
                                                                                : isInfoPersonnelKomissiiPolozhenie
                                                                                  ? t(INFO_PERSONNEL_KOMISSII_POLOZENIE_TITLE) || INFO_PERSONNEL_KOMISSII_POLOZENIE_TITLE
                                                                                  : isInfoPersonnelKomissiiSostav
                                                                                    ? t(INFO_PERSONNEL_KOMISSII_SOSTAV_TITLE) || INFO_PERSONNEL_KOMISSII_SOSTAV_TITLE
                                                                                    : isInfoPersonnelKomissiiResheniya
                                                                                      ? t(INFO_PERSONNEL_KOMISSII_RESHENIYA_TITLE) || INFO_PERSONNEL_KOMISSII_RESHENIYA_TITLE
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
              : isInfoFinance || slug === "about/finances"
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
                                      : isInfoPolnomochiyaSpeaker
                                        ? INFO_POLNOMOCHIYA_SPEAKER_HTML
                                        : isInfoCorruption
                                          ? INFO_CORRUPTION_HTML
                                          : isInfoCorruptionNormativnye
                                            ? INFO_CORRUPTION_NORMATIVERNIE_HTML
                                            : isInfoCorruptionKomissiyaDeputatov
                                              ? INFO_CORRUPTION_KOMISSIYA_DEPUTATOV_HTML
                                              : isInfoCorruptionKomissiyaVypiski
                                                ? INFO_CORRUPTION_KOMISSIYA_VYPISKI_HTML
                                                : isInfoCorruptionKomissiyaInformaciya
                                                  ? INFO_CORRUPTION_KOMISSIYA_INFORMACSIYA_HTML
                                                  : isInfoCorruptionMetodicheskie
                                                    ? INFO_CORRUPTION_METODICHESKIE_HTML
                                                    : isInfoCorruptionObratnayaSvyaz
                                                      ? INFO_CORRUPTION_OBRATNAYA_SVYAZ_HTML
                                                      : isInfoCorruptionFormyDokumentov
                                                        ? INFO_CORRUPTION_FORMY_DOKUMENTOV_HTML
                                                        : isInfoCorruptionSpavkeBK
                                                          ? INFO_CORRUPTION_SPAVKE_BK_HTML
                                                          : isInfoCorruptionPlan
                                                            ? INFO_CORRUPTION_PLAN_HTML
                                                            : isInfoContacts
                                                              ? INFO_CONTACTS_HTML
                                                              : isInfoGosimvoli
                                                                ? INFO_GOSIMVOLI_HTML
                                                                : (isInfoGranisa || slug === "info/border-subject")
                                                                  ? INFO_GRANISA_HTML
                                                                  : isInfoGranisaShablony
                                                                    ? INFO_GRANISA_SHABLONY_HTML
                                                                    : isInfoGranisaShema
                                                                      ? INFO_GRANISA_SHema_HTML
                                                                      : isInfoGranisaIndivPropusk
                                                                        ? INFO_GRANISA_INDIV_PROPUSK_HTML
                                                                        : isInfoGranisaKolPropusk
                                                                          ? INFO_GRANISA_KOL_PROPUSK_HTML
                                                                          : isInfoGranisaZayavlenieZakon
                                                                            ? INFO_GRANISA_ZAYAVLENIE_ZAKON_HTML
                                                                            : isInfoGranisaZayavlenieIndiv
                                                                              ? INFO_GRANISA_ZAYAVLENIE_INDIV_HTML
                                                                              : isInfoGranisaZayavlenieKol
                                                                                ? INFO_GRANISA_ZAYAVLENIE_KOL_HTML
                                                                                : isInfoGranisaZayavleniePromyslovaya
                                                                                  ? INFO_GRANISA_ZAYAVLENIE_PROMYSLOVAYA_HTML
                                                                                  : isInfoGranisaZayavlenieHoz
                                                                                    ? INFO_GRANISA_ZAYAVLENIE_HOZ_HTML
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
                                                         : isInfoPersonnelVakansii
                                                           ? INFO_PERSONNEL_VAKANSII_HTML
                                                           : isInfoPersonnelKonkursy
                                                             ? INFO_PERSONNEL_KONKURSY_HTML
                                                             : isInfoPersonnelMetodika
                                                               ? INFO_PERSONNEL_METODIKA_HTML
                                                               : isInfoPersonnelKomissii
                                                                 ? INFO_PERSONNEL_KOMISSII_HTML
                                                                  : isInfoPersonnelDokumenty
                                                                    ? INFO_PERSONNEL_DOKUMENTY_HTML
                                                                    : isInfoPersonnelKonkursyProtokol
                                                                      ? INFO_PERSONNEL_KONKURSY_PROTOKOL_HTML
                                                                      : isInfoPersonnelKonkursyProtokol1
                                                                        ? INFO_PERSONNEL_KONKURSY_PROTOKOL_1_HTML
                                                                        : isInfoPersonnelKonkursyProtokol2
                                                                          ? INFO_PERSONNEL_KONKURSY_PROTOKOL_2_HTML
                                                                          : isInfoPersonnelKonkursyObYavlenie
                                                                            ? INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_HTML
                                                                            : isInfoPersonnelKonkursyObYavlenieKomissii
                                                                              ? INFO_PERSONNEL_KONKURSY_OB_YAVLENIE_KOMISSII_HTML
                                                                              : isInfoPersonnelKomissiiRasporyazhenie
                                                                                ? INFO_PERSONNEL_KOMISSII_RASPORYAZHENIE_HTML
                                                                                : isInfoPersonnelKomissiiPolozhenie
                                                                                  ? INFO_PERSONNEL_KOMISSII_POLOZENIE_HTML
                                                                                  : isInfoPersonnelKomissiiSostav
                                                                                    ? INFO_PERSONNEL_KOMISSII_SOSTAV_HTML
                                                                                    : isInfoPersonnelKomissiiResheniya
                                                                                      ? INFO_PERSONNEL_KOMISSII_RESHENIYA_HTML
                                                                                      : extractPageHtml(page, locale)
          : extractPageHtml(page, locale);
  const displayHtml = useAutomaticTranslation(
    html,
    lang === "ty" && !hasLocalizedPageHtml(page, locale)
  );

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
          <div style={!isInfoHistory && !isInfoPolnomochiya ? undefined : { gridColumn: '1 / -1' }}>
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
                {html ? (
                  <div
                    data-no-auto-translate
                    onClick={onHtmlContentClick}
                    dangerouslySetInnerHTML={{ __html: displayHtml }}
                  />
                ) : (
                  <div>—</div>
                )}
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
          {!isInfoHistory && !isInfoPolnomochiya && (
            <SideNav
              title={isFederationCouncil ? undefined : (isInfoSection ? undefined : (isCodeOfHonor || isMothersCommandments ? undefined : title))}
              links={isFederationCouncil ? [
                { label: "Общие сведения", href: "/about" },
                { label: "Структура парламента", href: "/about?tab=structure&focus=overview" },
                { label: "Руководство", href: "/government" },
                { label: "Комитеты", href: "/about?tab=structure&focus=committees" },
                { label: "Комиссии", href: "/about?tab=structure&focus=commissions" },
                { label: "Депутатские фракции", href: "/about?tab=structure&focus=factions" },
                { label: "Представительство в Совете Федерации", href: "/struct/council" },
                { label: "Молодежный Хурал", href: "/youth-parliament" },
              ] : undefined}
              loadPages={true}
              autoSection={true}
            />
          )}
        </div>
      </div>
      <PdfPreviewModal
        open={Boolean(docPreview)}
        onClose={() => setDocPreview(null)}
        url={docPreview?.url}
        title={docPreview?.title}
      />
    </section>
  );
}
