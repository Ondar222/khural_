import React from "react";
import { Button, Form, Input, Select, Space, Card, Switch, App } from "antd";
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { AboutApi, DocumentsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { upsertPageOverride, PAGES_OVERRIDES_EVENT_NAME } from "../../utils/pagesOverrides.js";
import { refreshPagesTree } from "../../utils/cmsPagesTree.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import ImageUploadField from "../../components/ImageUploadField.jsx";
import VideoUploadField from "../../components/VideoUploadField.jsx";
import { applyBlockUploads, collectBlockUploads } from "../../utils/cmsImages.js";
import { useTranslation } from "../../hooks/useTranslation.js";

function slugify(input) {
  if (!input) return "";
  
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya'
  };
  
  return String(input || "")
    .trim()
    .toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BLOCK_TYPES = [
  { value: "text", label: "Текст" },
  { value: "image", label: "Изображение" },
  { value: "gallery", label: "Галерея" },
  { value: "file", label: "Документ" },
  { value: "link", label: "Ссылка" },
  { value: "quote", label: "Цитата" },
  { value: "video", label: "Видео" },
];

export default function AdminPagesV2Create({ canWrite, onDone }) {
  const { reload } = useData();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [busy, setBusy] = React.useState(false);
  const [parents, setParents] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const blocks = Form.useWatch("blocks", form) || [];
  const { translate, loading: translating, error: translationError, clearError } = useTranslation();

  React.useEffect(() => {
    if (translationError) {
      message.error("Ошибка при переводе: " + (translationError?.message || "Неизвестная ошибка"));
      clearError();
    }
  }, [translationError, message, clearError]);

  const prefillParent = React.useMemo(() => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search || "" : "");
    return sp.get("parent") ? decodeURIComponent(sp.get("parent")) : "";
  }, []);

  const prefillSlug = React.useMemo(() => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search || "" : "");
    return sp.get("slug") ? decodeURIComponent(sp.get("slug")) : "";
  }, []);

  const prefillTitle = React.useMemo(() => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search || "" : "");
    return sp.get("title") ? decodeURIComponent(sp.get("title")) : "";
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
    form.setFieldValue("parentSlug", prefillParent || "");
    if (prefillTitle) {
      form.setFieldValue("title", prefillTitle);
    }
    if (prefillSlug) {
      form.setFieldValue("slugLeaf", prefillSlug);
    } else if (prefillTitle) {
      form.setFieldValue("slugLeaf", slugify(prefillTitle));
    }
  }, [form, prefillParent, prefillSlug, prefillTitle]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      // Load parents for both locales to allow easy nesting
      const [ru, tyv] = await Promise.all([
        AboutApi.listPages({ locale: "ru" }).catch(() => []),
        AboutApi.listPages({ locale: "tyv" }).catch(() => []),
      ]);
      const all = []
        .concat(Array.isArray(ru) ? ru : Array.isArray(ru?.items) ? ru.items : [])
        .concat(Array.isArray(tyv) ? tyv : Array.isArray(tyv?.items) ? tyv.items : []);

      // Deduplicate by slug and create parent options
      const slugMap = new Map();
      all.forEach((p) => {
        const slug = String(p.slug || "").replace(/^\/+|\/+$/g, "");
        if (!slug || !p?.title) return;
        // Keep the first occurrence (prefer RU title if available)
        if (!slugMap.has(slug)) {
          slugMap.set(slug, p);
        }
      });

      // Static options for main site sections
      const staticOptions = [
        { value: "", label: "— Главная страница —", isGroup: true },
        { value: "header", label: "Header (Главное меню)", isStatic: true },
        { value: "footer", label: "Footer (Подвал сайта)", isStatic: true },
        { value: "news", label: "Новости", isStatic: true },
        { value: "deputies", label: "Депутаты", isStatic: true },
        { value: "documents", label: "Документы", isStatic: true },
        { value: "about", label: "О Хурале", isStatic: true },
        { value: "committees", label: "Комитеты", isStatic: true },
        { value: "commissions", label: "Комиссии", isStatic: true },
        { value: "activity", label: "Деятельность", isStatic: true },
        { value: "contacts", label: "Контакты", isStatic: true },
        { value: "appeals", label: "Обращения", isStatic: true },
        { value: "broadcast", label: "Трансляция", isStatic: true },
      ];

      // Dynamic options from existing pages
      const dynamicOptions = Array.from(slugMap.values())
        .map((p) => ({
          value: String(p.slug).replace(/^\/+|\/+$/g, ""),
          label: `${p.title} (${p.slug})`,
          isStatic: false,
        }))
        .sort((a, b) => a.label.localeCompare(b.label, "ru"));

      // Combine static and dynamic options
      const parentOptions = [
        ...staticOptions,
        { value: "divider", label: "─────────────────────", isDivider: true, disabled: true },
        ...dynamicOptions,
      ];

      if (alive) setParents(parentOptions);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onTitleChange = React.useCallback(() => {
    const title = form.getFieldValue("title");
    const currentLeaf = form.getFieldValue("slugLeaf");
    if (currentLeaf) return;
    form.setFieldValue("slugLeaf", slugify(title));
  }, [form]);

  const handleTranslate = React.useCallback(
    async (fromLang, toLang) => {
      const values = form.getFieldsValue();
      // В форме создания основные поля называются title/content,
      // а не titleRu/contentRu (как в форме редактирования).
      const titleField = fromLang === "ru" ? "title" : "titleTy";
      const contentField = fromLang === "ru" ? "content" : "contentTy";
      const titleTarget = toLang === "tyv" ? "titleTy" : "title";
      const contentTarget = toLang === "tyv" ? "contentTy" : "content";

      const title = String(values[titleField] || "").trim();
      const content = String(values[contentField] || "").trim();

      if (!title && !content) {
        message.warning("Заполните поля для перевода");
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
        message.success("Перевод выполнен");
      } catch (e) {
        console.error("Translation error:", e);
        message.error("Ошибка при переводе текста");
      }
    },
    [form, translate, message]
  );

  const submit = React.useCallback(async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const values = await form.validateFields();
      let parentSlug = String(values.parentSlug || "").trim().replace(/^\/+|\/+$/g, "");
      const leaf = String(values.slugLeaf || "").trim().replace(/^\/+|\/+$/g, "");
      
      // Map static section slugs to actual paths
      const staticSectionMap = {
        "header": "",  // Root level for header pages
        "footer": "",  // Root level for footer pages
        "news": "news",
        "deputies": "deputies",
        "documents": "documents",
        "about": "about",
        "committees": "committees",
        "commissions": "commissions",
        "activity": "activity",
        "contacts": "contacts",
        "appeals": "appeals",
        "broadcast": "broadcast",
      };
      
      if (Object.prototype.hasOwnProperty.call(staticSectionMap, parentSlug)) {
        const mappedSlug = staticSectionMap[parentSlug];
        // For static sections, use the mapped slug as parent
        parentSlug = mappedSlug;
      }
      
      // Build full slug: parent/leaf or just leaf
      const fullSlug = parentSlug ? `${parentSlug}/${leaf}` : leaf;
      
      console.log('[AdminPagesV2Create] Creating page:', {
        parentSlug: values.parentSlug,
        mappedParentSlug: parentSlug,
        leaf,
        fullSlug,
        title: values.title,
      });

      // Формируем блоки контента. Блоки с новыми файлами (изображения)
      // загружаем отдельно через batch-эндпоинт после создания страницы.
      const { contentBlocks, uploadBlocks, files } = collectBlockUploads(values.blocks);

      // Формируем контент с локалями: RU (основной) + TYV (если есть перевод)
      const contentArray = [];
      const contentLocale = String(values.locale || "ru").toLowerCase();
      contentArray.push({
        locale: contentLocale,
        title: values.title,
        content: values.content || "",
        ...(Array.isArray(contentBlocks) && contentBlocks.length > 0 ? { blocks: contentBlocks } : {}),
      });
      const titleTy = String(values.titleTy || "").trim();
      const contentTy = String(values.contentTy || "").trim();
      if (titleTy || contentTy) {
        contentArray.push({
          locale: "tyv",
          title: titleTy,
          content: contentTy,
        });
      }

      const created = await AboutApi.createPage({
        title: values.title,
        slug: fullSlug,
        isPublished: values.isPublished !== undefined ? Boolean(values.isPublished) : true,
        locale: contentLocale,
        content: contentArray,
      });

      if (created && created.id != null) {
        await applyBlockUploads({
          pageId: created.id,
          page: created,
          locale: values.locale || "ru",
          uploadBlocks,
          files,
          reloadPage: () => AboutApi.getAdminPage(created.id),
        });
      } else if (uploadBlocks.length > 0) {
        throw new Error("Сервер не вернул ID созданной страницы");
      }

      // menu/submenu labels are stored as frontend overrides (backend strips unknown fields)
      upsertPageOverride({
        id: created?.id,
        slug: created?.slug || fullSlug,
        menuTitle: values.menuTitle || null,
        submenuTitle: values.submenuTitle || null,
      });
      message.success("Страница создана");
      reload();

      // Force reload pages tree in Header
      window.dispatchEvent(new CustomEvent(PAGES_OVERRIDES_EVENT_NAME));
      await refreshPagesTree();

      await onDone?.();
    } catch (error) {
      console.error("Failed to create page:", error);
      message.error(error?.message || "Не удалось создать страницу");
    } finally {
      setBusy(false);
    }
  }, [canWrite, form, onDone, reload, message]);

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

  const parentSlug = Form.useWatch("parentSlug", form);
  const slugLeaf = Form.useWatch("slugLeaf", form);
  const fullSlugPreview = React.useMemo(() => {
    const p = String(parentSlug || "").trim().replace(/^\/+|\/+$/g, "");
    const l = String(slugLeaf || "").trim().replace(/^\/+|\/+$/g, "");
    return p ? `${p}/${l}` : l;
  }, [parentSlug, slugLeaf]);

  return (
    <div className="admin-page-editor">
      <div className="admin-page-editor__hero">
        <div className="admin-page-editor__hero-row">
          <div className="admin-page-editor__hero-left">
            <div className="admin-page-editor__kicker">Страницы</div>
            <div className="admin-page-editor__title">Создать страницу</div>
            <div className="admin-page-editor__subtitle">Контентная страница для сайта</div>
          </div>
          <div className="admin-page-editor__hero-actions">
            <Button onClick={onDone}>Назад</Button>
            <Button type="primary" onClick={submit} loading={busy} disabled={!canWrite || busy || translating}>
              Создать
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card admin-page-editor__card">

        <Form layout="vertical" form={form} initialValues={{ locale: "ru", blocks: [], isPublished: true }}>
          <Form.Item label="Название страницы" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input onChange={onTitleChange} placeholder="Название страницы" />
          </Form.Item>

          <Form.Item label="Опубликовать" name="isPublished" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Название в меню" name="menuTitle">
            <Input placeholder="Название в меню (если отличается от названия страницы)" />
          </Form.Item>
          <Form.Item label="Название в подменю" name="submenuTitle">
            <Input placeholder="Название в подменю (если отличается от названия в меню)" />
          </Form.Item>
          <Form.Item label="Родитель (опционально)" name="parentSlug">
            <Select
              allowClear
              showSearch
              placeholder="Выберите раздел для размещения страницы"
              options={parents}
              filterOption={(input, option) =>
                String(option?.label || "").toLowerCase().includes(String(input || "").toLowerCase())
              }
              optionRender={(option) => {
                if (option.data.isDivider) {
                  return <div style={{ borderTop: "1px solid #d9d9d9", margin: "4px 0" }} />;
                }
                if (option.data.isGroup) {
                  return (
                    <div style={{ fontWeight: 700, color: "#666", fontSize: 12 }}>
                      {option.label}
                    </div>
                  );
                }
                return (
                  <div>
                    <div style={{ fontWeight: 600 }}>{option.label.split(' (')[0]}</div>
                    {option.data.isStatic ? null : (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{option.data.value}</div>
                    )}
                  </div>
                );
              }}
            />
          </Form.Item>
          <Form.Item
            label="Slug (последняя часть)"
            name="slugLeaf"
            rules={[{ required: true, message: "Введите slug" }]}
          >
            <Input placeholder="information" />
          </Form.Item>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            Итоговый URL: <code>{fullSlugPreview ? `/${fullSlugPreview}` : "..."}</code>
          </div>
          <Form.Item label="Язык" name="locale">
            <Select
              options={[
                { value: "ru", label: "Русский" },
                { value: "tyv", label: "Тыва" },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Содержимое"
            name="content"
            tooltip="Используйте редактор для форматирования текста"
            getValueFromEvent={(value) => value}
          >
            <TinyMCEEditor
              height={400}
              placeholder="Содержимое страницы"
            />
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
                  disabled={!canWrite || translating || busy}
                >
                  Получить автоматический перевод
                </Button>
              </div>
              <Form.Item label="Название (TY)" name="titleTy">
                <Input disabled={busy || !canWrite} placeholder="Название страницы на тувинском" />
              </Form.Item>
              <Form.Item
                label="Содержимое (TY)"
                name="contentTy"
                getValueFromEvent={(value) => value}
              >
                <TinyMCEEditor
                  height={300}
                  placeholder="Содержимое на тувинском"
                  disabled={busy || !canWrite}
                />
              </Form.Item>
            </div>
          </div>

          <Form.Item label="Блоки контента">
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
                                placeholder="Текст блока..."
                              />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "image" && (
                          <>
                            <Form.Item
                              name={[field.name, "image"]}
                              label="Изображение"
                              rules={[{ required: true, message: "Загрузите изображение" }]}
                            >
                              <ImageUploadField disabled={!canWrite || busy} />
                            </Form.Item>
                            <Form.Item
                              name={[field.name, "alt"]}
                              label="Альтернативный текст"
                              extra="Показывается под изображением, если подпись не заполнена"
                            >
                              <Input placeholder="Описание изображения" />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Подпись">
                              <Input placeholder="Подпись к изображению" />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "gallery" && (
                          <>
                            <Form.Item name={[field.name, "fileIds"]} label="Изображения" rules={[{ required: true }]}>
                              <Select
                                mode="multiple"
                                placeholder="Выберите изображения для галереи"
                                loading={loadingDocs}
                                showSearch
                                allowClear
                                filterOption={(input, option) =>
                                  String(option?.label || "")
                                    .toLowerCase()
                                    .includes(String(input || "").toLowerCase())
                                }
                                options={documents
                                  .filter((doc) => (doc.type || "").includes("image"))
                                  .map((doc) => ({
                                    value: doc.id,
                                    label: `${doc.title || doc.name || "Изображение"}`,
                                  }))}
                              />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Подпись к галерее">
                              <Input placeholder="Подпись к галерее" />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "file" && (
                          <>
                            <Form.Item name={[field.name, "fileId"]} label="Документ" rules={[{ required: true }]}>
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

                        {blockType === "quote" && (
                          <>
                            <Form.Item name={[field.name, "content"]} label="Текст цитаты" rules={[{ required: true }]}>
                              <Input.TextArea
                                autoSize={{ minRows: 3, maxRows: 8 }}
                                placeholder="Текст цитаты..."
                              />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Автор цитаты">
                              <Input placeholder="Имя автора" />
                            </Form.Item>
                          </>
                        )}

                        {blockType === "video" && (
                          <>
                            <Form.Item
                              name={[field.name, "content"]}
                              label="URL видео"
                              extra="Ссылка на YouTube/Rutube или загрузите файл ниже"
                              rules={[
                                {
                                  validator: (_rule, value) => {
                                    const media = form.getFieldValue([
                                      "blocks",
                                      field.name,
                                      "video",
                                    ]);
                                    const hasFile =
                                      Boolean(media?.file) ||
                                      Boolean(String(media?.fileId || "").trim());
                                    return hasFile || String(value || "").trim()
                                      ? Promise.resolve()
                                      : Promise.reject(
                                          new Error("Укажите ссылку или загрузите видеофайл")
                                        );
                                  },
                                },
                              ]}
                            >
                              <Input placeholder="https://www.youtube.com/watch?v=..." />
                            </Form.Item>
                            <Form.Item name={[field.name, "video"]} label="Видеофайл">
                              <VideoUploadField disabled={!canWrite || busy} />
                            </Form.Item>
                            <Form.Item name={[field.name, "caption"]} label="Подпись к видео">
                              <Input placeholder="Подпись к видео" />
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


