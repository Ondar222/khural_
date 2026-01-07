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

  const onTitleChange = React.useCallback(() => {
    const title = form.getFieldValue("title");
    const currentSlug = form.getFieldValue("slug");
    if (currentSlug) return;
    form.setFieldValue("slug", slugify(title));
  }, [form]);

  const submit = React.useCallback(async () => {
    if (!canWrite) return;
    setBusy(true);
    try {
      const values = await form.validateFields();
      await AboutApi.createPage({
        title: values.title,
        slug: values.slug,
        locale: values.locale || "ru",
        content: values.content || "",
      });
      reload();
      onDone?.();
    } finally {
      setBusy(false);
    }
  }, [canWrite, form, onDone, reload]);

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
          <Form.Item label="Slug (URL-адрес)" name="slug" rules={[{ required: true, message: "Введите slug" }]}>
            <Input placeholder="information" />
          </Form.Item>
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


