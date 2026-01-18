import React from "react";
import { App, Button, Form, Input, Switch } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminConvocationsEditor({
  mode,
  convocationId,
  items,
  onCreate,
  onUpdate,
  busy,
  canWrite,
}) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(mode === "edit");

  const nameValue = Form.useWatch("name", form);
  const isActiveValue = Form.useWatch("isActive", form);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(convocationId || "");
    if (!id) return;
    const found =
      (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
    setLoading(true);
    try {
      if (!found) return;
      // API использует поле "name" (например, "VII созыв")
      form.setFieldsValue({
        name: found.name || found.number || "",
        description: found.description || "",
        isActive: found.isActive !== false,
      });
    } finally {
      setLoading(false);
    }
  }, [mode, convocationId, items, form]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      // Отправляем все поля: name, description, isActive
      const payload = {
        name: values.name,
        description: values.description || "",
        isActive: values.isActive !== false,
      };
      if (mode === "create") {
        await onCreate?.(payload);
        message.success("Созыв создан");
      } else {
        await onUpdate?.(String(convocationId), payload);
        message.success("Созыв обновлен");
      }
      navigate("/admin/convocations");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось сохранить созыв");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-events-editor">
      <div className="admin-events-editor__hero">
        <div className="admin-events-editor__hero-row">
          <div className="admin-events-editor__hero-left">
            <div className="admin-events-editor__kicker">Созывы</div>
            <div className="admin-events-editor__title">
              {mode === "create" ? "Добавить созыв" : "Редактировать созыв"}
            </div>
            {mode === "edit" && nameValue ? (
              <div className="admin-events-editor__subtitle">{String(nameValue)}</div>
            ) : (
              <div className="admin-events-editor__subtitle">Управление созывами</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions">
            <Button onClick={() => navigate("/admin/convocations")}>Отмена</Button>
            <Button
              type="primary"
              onClick={onSave}
              disabled={!canWrite}
              loading={Boolean(busy || saving)}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-events-editor__section-title">Детали созыва</div>
        <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
          <Form.Item
            label="Название созыва"
            name="name"
            rules={[{ required: true, message: "Укажите название созыва" }]}
            tooltip="Например: 'VII созыв' или 'VIII созыв'"
          >
            <Input placeholder="VII созыв" disabled={loading || saving} />
          </Form.Item>

          <Form.Item label="Краткое описание" name="description">
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="Краткое описание созыва"
              disabled={loading || saving}
            />
          </Form.Item>

          <Form.Item
            label="Статус"
            name="isActive"
            valuePropName="checked"
            tooltip="Активный - текущий созыв, Архив - прошлые созывы"
          >
            <Switch disabled={loading || saving} />
            <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
              {isActiveValue !== false ? "Активный" : "Архив"}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

