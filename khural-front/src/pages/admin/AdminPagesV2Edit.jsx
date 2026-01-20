import React from "react";
import { Button, Form, Input, Select, Space, Card, Switch, message as antdMessage } from "antd";
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { AboutApi, apiFetch, DocumentsApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { getPageOverrideById, upsertPageOverride } from "../../utils/pagesOverrides.js";

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

export default function AdminPagesV2Edit({ id, canWrite, onDone }) {
  const { reload } = useData();
  const [form] = Form.useForm();
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [parents, setParents] = React.useState([]);
  const [documents, setDocuments] = React.useState([]);
  const [loadingDocs, setLoadingDocs] = React.useState(false);
  const blocks = Form.useWatch("blocks", form) || [];

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

        // Извлекаем контент и блоки
        let contentValue = "";
        let blocksValue = [];
        if (page.content && Array.isArray(page.content) && page.content.length > 0) {
          const ruContent = page.content.find((c) => c.locale === "ru") || page.content[0];
          contentValue = ruContent?.content || "";
          blocksValue = ruContent?.blocks || [];
        } else if (page.content && typeof page.content === "string") {
          contentValue = page.content;
        }

        const ov = getPageOverrideById(page?.id);

        form.setFieldsValue({
          title: page.title || page.name || "",
          isPublished: Boolean(page?.isPublished),
          menuTitle: ov?.menuTitle || "",
          submenuTitle: ov?.submenuTitle || "",
          parentSlug,
          slugLeaf: leaf,
          locale: page.locale || page.lang || "ru",
          content: contentValue,
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

      // Формируем блоки контента
      const contentBlocks = (values.blocks || []).map((block, index) => ({
        type: block.type || "text",
        order: block.order !== undefined ? block.order : index,
        content: block.content || null,
        caption: block.caption || null,
        alt: block.alt || null,
        fileId: block.fileId || null,
        metadata: block.metadata || null,
      }));

      const saved = await AboutApi.updatePage(id, {
        title: values.title,
        slug: fullSlug,
        isPublished: values.isPublished !== undefined ? Boolean(values.isPublished) : undefined,
        locale: values.locale || "ru",
        content: [
          {
            locale: values.locale || "ru",
            title: values.title,
            content: values.content || "",
            blocks: contentBlocks,
          },
        ],
      });

      upsertPageOverride({
        id: saved?.id ?? id,
        slug: saved?.slug || fullSlug,
        menuTitle: values.menuTitle || null,
        submenuTitle: values.submenuTitle || null,
      });
      antdMessage.success("Страница сохранена");
      reload();
      onDone?.();
    } catch (error) {
      console.error("Failed to save page:", error);
      antdMessage.error(error?.message || "Не удалось сохранить страницу");
    } finally {
      setBusy(false);
    }
  }, [canWrite, form, id, onDone, reload]);

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
        <Form layout="vertical" form={form} initialValues={{ locale: "ru", blocks: [] }}>
          <Form.Item label="Название страницы" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input disabled={loading} placeholder="Название страницы" />
          </Form.Item>

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

          <Form.Item label="Язык" name="locale">
            <Select
              disabled={loading}
              options={[
                { value: "ru", label: "Русский" },
                { value: "tyv", label: "Тыва" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Содержимое (HTML)"
            name="content"
            tooltip="Любой HTML: p, h1-h6, strong/em, ul/ol/li, a, img и т.д. Сохраняется как есть."
          >
            <Input.TextArea
              disabled={loading}
              autoSize={{ minRows: 12, maxRows: 28 }}
              placeholder="<p>Содержимое страницы</p>\n<h2>Заголовок</h2>\n<ul><li>Пункт списка</li></ul>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
            />
          </Form.Item>

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
                            <Form.Item name={[field.name, "content"]} label="Текст (HTML)">
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
