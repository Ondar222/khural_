import React from "react";
import { App, Button, Form, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminEventEditor({ mode, eventId, items, onCreate, onUpdate, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(mode === "edit");

  const titleValue = Form.useWatch("title", form);
  const descHtml = Form.useWatch("desc", form);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(eventId || "");
    if (!id) return;
    const found = (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
    setLoading(true);
    try {
      if (!found) return;
      form.setFieldsValue({
        date: found.date || "",
        time: found.time || "",
        place: found.place || "",
        title: found.title || "",
        desc: found.desc || "",
      });
    } finally {
      setLoading(false);
    }
  }, [mode, eventId, items, form]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = { ...values, desc: values.desc || "" };
      if (mode === "create") {
        await onCreate?.(payload);
        message.success("Событие создано");
      } else {
        await onUpdate?.(String(eventId), payload);
        message.success("Событие обновлено");
      }
      navigate("/admin/events");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось сохранить событие");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-events-editor">
      <div className="admin-events-editor__hero">
        <div className="admin-events-editor__hero-row">
          <div className="admin-events-editor__hero-left">
            <div className="admin-events-editor__kicker">События</div>
            <div className="admin-events-editor__title">{mode === "create" ? "Добавить событие" : "Редактировать событие"}</div>
            {mode === "edit" && titleValue ? (
              <div className="admin-events-editor__subtitle">{String(titleValue)}</div>
            ) : (
              <div className="admin-events-editor__subtitle">Календарь и важные мероприятия</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions">
            <Button onClick={() => navigate("/admin/events")}>Отмена</Button>
            <Button type="primary" onClick={onSave} disabled={!canWrite} loading={Boolean(busy || saving)}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-events-editor__section-title">Детали события</div>
        <Form
          layout="vertical"
          form={form}
          initialValues={{ date: new Date().toISOString().slice(0, 10) }}
        >
          <Form.Item label="Дата" name="date" rules={[{ required: true, message: "Укажите дату" }]}>
            <Input type="date" disabled={loading || saving} />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Время" name="time">
              <Input placeholder="10:00" disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Место" name="place">
              <Input placeholder="Зал заседаний" disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item label="Название" name="title" rules={[{ required: true, message: "Укажите название" }]}>
            <Input disabled={loading || saving} />
          </Form.Item>

          <Form.Item label="Описание" name="desc">
            <Input.TextArea
              autoSize={{ minRows: 6, maxRows: 18 }}
              placeholder="<p>Описание</p>"
              value={typeof descHtml === "string" ? descHtml : ""}
              onChange={(e) => form.setFieldValue("desc", e.target.value)}
              disabled={loading || saving}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}


