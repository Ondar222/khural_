import React from "react";
import { Button, Form, Input, Select } from "antd";
import { AboutApi, apiFetch } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";
import { Editor } from "@tinymce/tinymce-react";

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

export default function AdminPagesV2Edit({ id, canWrite, onDone }) {
  const { reload } = useData();
  const [form] = Form.useForm();
  const [busy, setBusy] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [parents, setParents] = React.useState([]);
  const contentHtml = Form.useWatch("content", form);

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
      setLoading(true);
      try {
        const page = await getPageById(id);
        if (!alive) return;
        if (!page) throw new Error("Страница не найдена");
        const slug = String(page.slug || "");
        const parts = slug.split("/").filter(Boolean);
        const parentSlug = parts.slice(0, -1).join("/");
        const leaf = parts.slice(-1)[0] || "";
        form.setFieldsValue({
          title: page.title || page.name || "",
          parentSlug,
          slugLeaf: leaf,
          locale: page.locale || page.lang || "ru",
          content: page.content || page.body || "",
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
      await AboutApi.updatePage(id, {
        title: values.title,
        slug: fullSlug,
        locale: values.locale || "ru",
        content: values.content || "",
      });
      reload();
      onDone?.();
    } finally {
      setBusy(false);
    }
  }, [canWrite, form, id, onDone, reload]);

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

        <Form layout="vertical" form={form} initialValues={{ locale: "ru" }}>
          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input disabled={loading} />
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
          <Form.Item label="Содержимое (HTML)" name="content">
            <Editor
              apiKey={"qu8gahwqf4sz5j8567k7fmk76nqedf655jhu2c0d9bhvc0as"}
              value={typeof contentHtml === "string" ? contentHtml : ""}
              onEditorChange={(content) => form.setFieldValue("content", content)}
              init={{
                height: 520,
                menubar: true,
              }}
              plugins={["lists", "link", "image", "media"]}
              toolbar="lists link image media"
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}



