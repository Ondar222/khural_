import React from "react";
import { Button, Form, Input, Select } from "antd";
import { AboutApi } from "../../api/client.js";
import { useData } from "../../context/DataContext.jsx";

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\-а-яё]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPagesV2Create({ canWrite, onDone }) {
  const { reload } = useData();
  const [form] = Form.useForm();
  const [busy, setBusy] = React.useState(false);
  const [parents, setParents] = React.useState([]);

  const prefillParent = React.useMemo(() => {
    const sp = new URLSearchParams(typeof window !== "undefined" ? window.location.search || "" : "");
    return sp.get("parent") ? decodeURIComponent(sp.get("parent")) : "";
  }, []);

  React.useEffect(() => {
    form.setFieldValue("parentSlug", prefillParent || "");
  }, [form, prefillParent]);

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
      const slugs = Array.from(
        new Set(all.map((p) => String(p.slug || "")).filter((s) => s))
      ).sort();
      if (alive) setParents(slugs);
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

  const submit = React.useCallback(async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const values = await form.validateFields();
      const parentSlug = String(values.parentSlug || "").trim().replace(/^\/+|\/+$/g, "");
      const leaf = String(values.slugLeaf || "").trim().replace(/^\/+|\/+$/g, "");
      const fullSlug = parentSlug ? `${parentSlug}/${leaf}` : leaf;
      await AboutApi.createPage({
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
  }, [canWrite, form, onDone, reload]);

  const parentSlug = Form.useWatch("parentSlug", form);
  const slugLeaf = Form.useWatch("slugLeaf", form);
  const fullSlugPreview = React.useMemo(() => {
    const p = String(parentSlug || "").trim().replace(/^\/+|\/+$/g, "");
    const l = String(slugLeaf || "").trim().replace(/^\/+|\/+$/g, "");
    return p ? `${p}/${l}` : l;
  }, [parentSlug, slugLeaf]);

  return (
    <div className="admin-grid">
      <div className="admin-card" style={{ maxWidth: 980 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Создать страницу</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onDone}>Назад</Button>
            <Button type="primary" onClick={submit} loading={busy} disabled={!canWrite}>
              Создать
            </Button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <Form layout="vertical" form={form} initialValues={{ locale: "ru" }}>
          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Введите название" }]}>
            <Input onChange={onTitleChange} />
          </Form.Item>
          <Form.Item label="Родитель (опционально)" name="parentSlug">
            <Select
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
            <Input placeholder="information" />
          </Form.Item>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            Итоговый URL: <code>{`/p/${fullSlugPreview || "..."}`}</code>
          </div>
          <Form.Item label="Язык" name="locale">
            <Select
              options={[
                { value: "ru", label: "Русский" },
                { value: "tyv", label: "Тыва" },
              ]}
            />
          </Form.Item>
          <Form.Item label="Содержимое (HTML)" name="content">
            <Input.TextArea autoSize={{ minRows: 14, maxRows: 28 }} placeholder="<p>...</p>" />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}



