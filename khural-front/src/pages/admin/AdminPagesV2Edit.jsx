import React from "react";
import { Button, Form, Input, Select, Space, Card, Switch, message as antdMessage } from "antd";
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { AboutApi, apiFetch, DocumentsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { getPageOverrideById, upsertPageOverride } from "../../utils/pagesOverrides.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { FOR_MEDIA_HTML, FOR_MEDIA_SLUG, FOR_MEDIA_TITLE } from "../../content/forMedia.js";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object" && Array.isArray(res.items)) return res.items;
  return [];
}

async function getPageById(id) {
  // Try the obvious endpoint first
  try {
    return await apiFetch(`/pages/${encodeURIComponent(id)}`, { method: "GET", auth: true });
  } catch {
    // Fallback: load list and find
    const all = normalizeList(await apiFetch("/pages", { method: "GET", auth: true }));
    return all.find((p) => String(p.id) === String(id)) || null;
  }
}

const BLOCK_TYPES = [
  { value: "text", label: "Текст" },
  { value: "link", label: "Ссылка" },
  { value: "file", label: "Документ" },
];

/** Slug страницы «Кодекс чести мужчины Тувы». */
const CODE_OF_HONOR_SLUG = "code-of-honor";
/** Контент для подстановки в админке (источник: khural.rtyva.ru). */
const CODE_OF_HONOR_DEFAULTS = {
  titleRu: "Кодекс чести мужчины Тувы",
  contentRu: `<p>Мы, мужчины Республики Тыва,</p>
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
</ol>`,
  titleTy: "Кодекс чести мужчины Тувы",
  contentTy: `<p>Бистер, Тыва Республиканың эр кижилери, боттарывыстың эрге-ажыктарывысты болгаш күзел-чүткүлдеривисти илеретпишаан;</p>
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
</ol>`,
};

/** Slug страницы «Свод заповедей матерей Тувы». */
const MOTHERS_COMMANDMENTS_SLUG = "mothers-commandments";
const MOTHERS_COMMANDMENTS_DEFAULTS = {
  titleRu: "Свод заповедей матерей Тувы",
  contentRu: `<p>Мы, матери Тувы,</p>
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
</ol>`,
  titleTy: "ТЫВАНЫҢ ИЕЛЕРИНИҢ ЫДЫКТЫГ САГЫЛГАЛАРЫ",
  contentTy: `<p>Бис, Тываның иелери,</p>
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
</ol>`,
};

/** Контент для подстановки страницы «Для СМИ». */
const FOR_MEDIA_DEFAULTS = {
  titleRu: FOR_MEDIA_TITLE,
  contentRu: FOR_MEDIA_HTML,
  titleTy: "",
  contentTy: "",
};

export default function AdminPagesV2Edit({ id, canWrite, onDone }) {
  const { reload } = useData();
  const [form] = Form.useForm();
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [parents, setParents] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const blocks = Form.useWatch("blocks", form) || [];
  const { translate, loading: translating, error: translationError, clearError } = useTranslation();

  React.useEffect(() => {
    if (translationError) {
      antdMessage.error("Ошибка при переводе: " + (translationError?.message || "Неизвестная ошибка"));
      clearError();
    }
  }, [translationError, clearError]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const all = normalizeList(await apiFetch("/pages", { method: "GET", auth: true }).catch(() => []));
      const slugs = Array.from(new Set((all || []).map((p) => String(p.slug || "")).filter(Boolean))).sort();
      if (alive) setParents(slugs);
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingDocs(true);
      try {
        const docs = await DocumentsApi.listAll().catch(() => []);
        if (alive) setDocuments(Array.isArray(docs) ? docs : []);
      } catch (e) {
        console.error("Failed to load documents:", e);
      } finally {
        if (alive) setLoadingDocs(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const page = await getPageById(id);
        if (!alive) return;
        if (!page) throw new Error("Страница не найдена");
        const slug = String(page.slug || "");
        const parts = slug.split("/").filter(Boolean);
        const parentSlug = parts.slice(0, -1).join("/");
        const leaf = parts.slice(-1)[0] || "";

        const contentArray = page.content && Array.isArray(page.content) ? page.content : [];
        const ruContent = contentArray.find((c) => String(c?.locale || "").toLowerCase() === "ru") || contentArray[0] || {};
        const tyvContent = contentArray.find((c) => String(c?.locale || "").toLowerCase() === "tyv") || {};
        let blocksValue = ruContent?.blocks || [];
        if (contentArray.length && !Array.isArray(ruContent?.blocks) && contentArray[0]?.blocks) {
          blocksValue = contentArray[0].blocks;
        }
        if (page.content && typeof page.content === "string") {
          blocksValue = [];
        }

        const legacyContent = typeof page.content === "string" ? page.content : "";
        const isCodeOfHonor = leaf === CODE_OF_HONOR_SLUG;
        const isMothersCommandments = leaf === MOTHERS_COMMANDMENTS_SLUG;
        const ruTitle = ruContent?.title ?? page.title ?? page.name ?? "";
        const ruBody = ruContent?.content ?? legacyContent ?? "";
        const tyTitle = tyvContent?.title ?? "";
        const tyBody = tyvContent?.content ?? "";
        const useCodeOfHonorDefaults = isCodeOfHonor && (ruBody.length < 100 || !ruBody.trim());
        const useMothersCommandmentsDefaults = isMothersCommandments && (ruBody.length < 100 || !ruBody.trim());
        const isForMedia = leaf === FOR_MEDIA_SLUG;
        const useForMediaDefaults = isForMedia && (ruBody.length < 100 || !ruBody.trim());
        const defaults = useCodeOfHonorDefaults
          ? CODE_OF_HONOR_DEFAULTS
          : useMothersCommandmentsDefaults
            ? MOTHERS_COMMANDMENTS_DEFAULTS
            : useForMediaDefaults
              ? FOR_MEDIA_DEFAULTS
              : null;

        const ov = getPageOverrideById(page?.id);

        form.setFieldsValue({
          titleRu: defaults ? defaults.titleRu : ruTitle,
          contentRu: defaults ? defaults.contentRu : ruBody,
          titleTy: defaults ? defaults.titleTy : tyTitle,
          contentTy: defaults ? defaults.contentTy : tyBody,
          isPublished: Boolean(page?.isPublished),
          menuTitle: ov?.menuTitle || "",
          submenuTitle: ov?.submenuTitle || "",
          parentSlug,
          slugLeaf: leaf,
          blocks: blocksValue,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [form, id]);

  const submit = React.useCallback(async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const values = await form.validateFields();
      const parentSlug = String(values.parentSlug || "").trim().replace(/^\/+|\/+$/g, "");
      const leaf = String(values.slugLeaf || "").trim().replace(/^\/+|\/+$/g, "");
      const fullSlug = parentSlug ? `${parentSlug}/${leaf}` : leaf;

      const contentBlocks = (values.blocks || []).map((block, index) => ({
        type: block.type || "text",
        order: block.order !== undefined ? block.order : index,
        content: block.content || null,
        caption: block.caption || null,
        alt: block.alt || null,
        fileId: block.fileId || null,
        metadata: block.metadata || null,
      }));

      const titleRu = String(values.titleRu ?? "").trim();
      const contentRu = String(values.contentRu ?? "").trim();
      const titleTy = String(values.titleTy ?? "").trim();
      const contentTy = String(values.contentTy ?? "").trim();

      const contentArray = [];
      if (titleRu || contentRu) {
        contentArray.push({
          locale: "ru",
          title: titleRu || "—",
          content: contentRu || "",
          blocks: contentBlocks,
        });
      }
      if (titleTy || contentTy) {
        contentArray.push({
          locale: "tyv",
          title: titleTy || "—",
          content: contentTy || "",
        });
      }
      if (contentArray.length === 0) {
        antdMessage.error("Заполните хотя бы заголовок или контент для русского языка");
        setBusy(false);
        return;
      }

      const saved = await AboutApi.updatePage(id, {
        title: titleRu || contentArray[0]?.title,
        slug: fullSlug,
        isPublished: values.isPublished !== undefined ? Boolean(values.isPublished) : undefined,
        locale: "ru",
        content: contentArray,
      });

      upsertPageOverride({
        id: saved?.id ?? id,
        slug: saved?.slug || fullSlug,
        menuTitle: values.menuTitle || null,
        submenuTitle: values.submenuTitle || null,
      });
      antdMessage.success("Страница сохранена");

      if (saved == null) {
        try {
          const updated = await getPageById(id);
          if (updated) {
            const contentArrayReload = Array.isArray(updated.content) ? updated.content : [];
            const ruReload = contentArrayReload.find((c) => String(c?.locale || "").toLowerCase() === "ru") || contentArrayReload[0] || {};
            const tyvReload = contentArrayReload.find((c) => String(c?.locale || "").toLowerCase() === "tyv") || {};
            const blocksReload = ruReload?.blocks || [];
            form.setFieldsValue({
              titleRu: ruReload?.title ?? "",
              contentRu: ruReload?.content ?? "",
              titleTy: tyvReload?.title ?? "",
              contentTy: tyvReload?.content ?? "",
              blocks: blocksReload,
            });
          }
        } catch (e) {
          console.warn("Could not refetch page after save:", e);
        }
      }

      reload();
      onDone?.();
    } catch (error) {
      console.error("Failed to save page:", error);
      antdMessage.error(error?.message || "Не удалось сохранить страницу");
    } finally {
      setBusy(false);
    }
  }, [canWrite, form, id, onDone, reload]);

  const handleTranslate = React.useCallback(
    async (fromLang, toLang) => {
      const values = form.getFieldsValue();
      const titleField = fromLang === "ru" ? "titleRu" : "titleTy";
      const contentField = fromLang === "ru" ? "contentRu" : "contentTy";
      const titleTarget = toLang === "tyv" ? "titleTy" : "titleRu";
      const contentTarget = toLang === "tyv" ? "contentTy" : "contentRu";

      const title = String(values[titleField] || "").trim();
      const content = String(values[contentField] || "").trim();

      if (!title && !content) {
        antdMessage.warning("Заполните поля для перевода");
        return;
      }

      try {
        const translations = await Promise.all([
          title ? translate(title, fromLang, toLang) : Promise.resolve({ translated: "" }),
          content ? translate(content, fromLang, toLang) : Promise.resolve({ translated: "" }),
        ]);
        const translatedTitle = String(
          translations[0]?.translated || (typeof translations[0] === "string" ? translations[0] : "") || ""
        );
        const translatedContent = String(
          translations[1]?.translated || (typeof translations[1] === "string" ? translations[1] : "") || ""
        );
        form.setFieldsValue({
          [titleTarget]: translatedTitle,
          [contentTarget]: translatedContent,
        });
        antdMessage.success("Перевод выполнен");
      } catch (e) {
        console.error("Translation error:", e);
      }
    },
    [form, translate]
  );

  const addBlock = React.useCallback(() => {
    const currentBlocks = form.getFieldValue("blocks") || [];
    form.setFieldValue("blocks", [
      ...currentBlocks,
      {
        type: "text",
        order: currentBlocks.length,
        content: "",
        caption: "",
        alt: "",
        fileId: null,
      },
    ]);
  }, [form]);

  const removeBlock = React.useCallback(
    (index) => {
      const currentBlocks = form.getFieldValue("blocks") || [];
      form.setFieldValue(
        "blocks",
        currentBlocks.filter((_, i) => i !== index)
      );
    },
    [form]
  );

  const moveBlock = React.useCallback(
    (index, direction) => {
      const currentBlocks = form.getFieldValue("blocks") || [];
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= currentBlocks.length) return;
      const newBlocks = [...currentBlocks];
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      newBlocks[index].order = index;
      newBlocks[newIndex].order = newIndex;
      form.setFieldValue("blocks", newBlocks);
    },
    [form]
  );

  return (
    <div className="admin-page-editor">
      <div className="admin-page-editor__hero">
        <div className="admin-page-editor__hero-row">
          <div className="admin-page-editor__hero-left">
            <div className="admin-page-editor__kicker">Страницы</div>
            <div className="admin-page-editor__title">Редактировать страницу</div>
            <div className="admin-page-editor__subtitle">{String(id || "")}</div>
          </div>
          <div className="admin-page-editor__hero-actions">
            <Button onClick={onDone}>Назад</Button>
            <Button type="primary" onClick={submit} loading={busy} disabled={!canWrite || loading}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card admin-page-editor__card">
        <Form
          layout="vertical"
          form={form}
          initialValues={{ titleRu: "", contentRu: "", titleTy: "", contentTy: "", blocks: [] }}
        >
          <Form.Item label="Опубликовать" name="isPublished" valuePropName="checked">
            <Switch disabled={loading} />
          </Form.Item>
          <Form.Item label="Название в меню" name="menuTitle">
            <Input disabled={loading} placeholder="Название в меню (если отличается от названия страницы)" />
          </Form.Item>
          <Form.Item label="Название в подменю" name="submenuTitle">
            <Input disabled={loading} placeholder="Название в подменю (если отличается от названия в меню)" />
          </Form.Item>
          <Form.Item label="Родитель (опционально)" name="parentSlug">
            <Select
              disabled={loading}
              allowClear
              showSearch
              placeholder="Без родителя"
              options={parents.map((s) => ({ value: s, label: s }))}
              filterOption={(input, option) =>
                String(option?.value || "").toLowerCase().includes(String(input || "").toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            label="Slug (последняя часть)"
            name="slugLeaf"
            rules={[{ required: true, message: "Введите slug" }]}
          >
            <Input disabled={loading} />
          </Form.Item>

          <div className="admin-news-editor__lang-grid" style={{ marginTop: 16 }}>
            <div className="admin-card">
              <div className="admin-news-editor__lang-head">
                <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                  Тувинский язык
                </div>
                <Button
                  type="default"
                  onClick={() => handleTranslate("ru", "tyv")}
                  loading={translating}
                  disabled={!canWrite || translating || loading}
                >
                  Получить автоматический перевод
                </Button>
              </div>
              <Form.Item label="Название (TY)" name="titleTy">
                <Input disabled={loading} placeholder="Название страницы на тувинском" />
              </Form.Item>
              <Form.Item
                label="Содержимое (TY)"
                name="contentTy"
                getValueFromEvent={(v) => v}
              >
                <TinyMCEEditor
                  height={400}
                  placeholder="Содержимое на тувинском"
                  disabled={loading}
                />
              </Form.Item>
            </div>

            <div className="admin-card">
              <div className="admin-news-editor__lang-head">
                <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                  Русский язык
                </div>
                <Button
                  type="default"
                  onClick={() => handleTranslate("tyv", "ru")}
                  loading={translating}
                  disabled={!canWrite || translating || loading}
                >
                  Получить автоматический перевод
                </Button>
              </div>
              <Form.Item
                label="Название (RU) *"
                name="titleRu"
                rules={[{ required: true, message: "Введите название" }]}
              >
                <Input disabled={loading} placeholder="Название страницы на русском" />
              </Form.Item>
              <Form.Item
                label="Содержимое (RU) *"
                name="contentRu"
                getValueFromEvent={(v) => v}
                rules={[{ required: true, message: "Введите содержимое" }]}
              >
                <TinyMCEEditor
                  height={400}
                  placeholder="Содержимое на русском"
                  disabled={loading}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Блоки контента (русский)" style={{ marginTop: 16 }}>
            <Form.List name="blocks">
              {(fields, { add, remove }) => (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {fields.map((field, index) => {
                    const blockType = form.getFieldValue(["blocks", field.name, "type"]) || "text";
                    return (
                      <Card
                        key={field.key}
                        size="small"
                        title={
                          <Space>
                            <span>Блок {index + 1}</span>
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowUpOutlined />}
                              onClick={() => moveBlock(index, "up")}
                              disabled={index === 0}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<ArrowDownOutlined />}
                              onClick={() => moveBlock(index, "down")}
                              disabled={index === fields.length - 1}
                            />
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          </Space>
                        }
                      >
                        <Form.Item name={[field.name, "type"]} label="Тип блока" rules={[{ required: true }]}>
                          <Select options={BLOCK_TYPES} />
                        </Form.Item>

                        {blockType === "text" && (
                          <>
                            <Form.Item name={[field.name, "content"]} label="Текст">
                              <Input.TextArea
                                autoSize={{ minRows: 4, maxRows: 12 }}
                                placeholder="<p>Текст блока...</p>"
                              />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "link" && (
                          <>
                            <Form.Item name={[field.name, "content"]} label="URL ссылки" rules={[{ required: true }]}>
                              <Input placeholder="https://example.com" />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Текст ссылки">
                              <Input placeholder="Текст ссылки" />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "file" && (
                          <>
                            <Form.Item name={[field.name, "fileId"]} label="Документ">
                              <Select
                                placeholder="Выберите документ"
                                loading={loadingDocs}
                                showSearch
                                allowClear
                                filterOption={(input, option) =>
                                  String(option?.label || "")
                                    .toLowerCase()
                                    .includes(String(input || "").toLowerCase())
                                }
                                options={documents.map((doc) => ({
                                  value: doc.id,
                                  label: `${doc.title || doc.name || "Документ"} (${doc.type || "—"})`,
                                }))}
                              />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Подпись к документу">
                              <Input placeholder="Подпись к документу" />
                            </Form.Item>
                          </>
                        )}

                        <Form.Item name={[field.name, "order"]} hidden>
                          <Input type="number" />
                        </Form.Item>
                      </Card>
                    );
                  })}
                  <Button type="dashed" onClick={addBlock} icon={<PlusOutlined />} block>
                    Добавить блок
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
