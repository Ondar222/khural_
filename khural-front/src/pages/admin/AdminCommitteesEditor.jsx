import React from "react";
import { App, Button, Form, Input, Switch, Select } from "antd";
import { useHashRoute } from "../../Router.jsx";

export default function AdminCommitteesEditor({
  mode,
  committeeId,
  items,
  convocations,
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

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(committeeId || "");
    if (!id) return;
    const found =
      (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
    setLoading(true);
    try {
      if (!found) return;
      form.setFieldsValue({
        name: found.name || "",
        description: found.description || "",
        phone: found.phone || "",
        email: found.email || "",
        address: found.address || "",
        isActive: found.isActive !== false,
        convocationId: found.convocation?.id || found.convocationId || null,
      });
    } finally {
      setLoading(false);
    }
  }, [mode, committeeId, items, form]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        description: values.description || "",
        phone: values.phone || "",
        email: values.email || "",
        address: values.address || "",
        isActive: values.isActive !== false,
        convocationId: values.convocationId,
      };
      if (mode === "create") {
        await onCreate?.(payload);
        message.success("Комитет создан");
      } else {
        await onUpdate?.(String(committeeId), payload);
        message.success("Комитет обновлен");
      }
      navigate("/admin/committees");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось сохранить комитет");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-events-editor">
      <div className="admin-events-editor__hero">
        <div className="admin-events-editor__hero-row">
          <div className="admin-events-editor__hero-left">
            <div className="admin-events-editor__kicker">Комитеты</div>
            <div className="admin-events-editor__title">
              {mode === "create" ? "Добавить комитет" : "Редактировать комитет"}
            </div>
            {mode === "edit" && nameValue ? (
              <div className="admin-events-editor__subtitle">{String(nameValue)}</div>
            ) : (
              <div className="admin-events-editor__subtitle">Управление комитетами</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions">
            <Button onClick={() => navigate("/admin/committees")}>Отмена</Button>
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
        <div className="admin-events-editor__section-title">Детали комитета</div>
        <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
          <Form.Item
            label="Созыв"
            name="convocationId"
            rules={[{ required: true, message: "Выберите созыв" }]}
          >
            <Select
              placeholder="Выберите созыв"
              disabled={loading || saving}
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {(convocations || []).map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  Созыв {c.number} {c.isActive ? "(активный)" : "(архив)"}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Название комитета"
            name="name"
            rules={[{ required: true, message: "Укажите название комитета" }]}
          >
            <Input placeholder="Комитет по бюджету" disabled={loading || saving} />
          </Form.Item>

          <Form.Item label="Краткое описание" name="description">
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="Описание комитета"
              disabled={loading || saving}
            />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Телефон" name="phone">
              <Input placeholder="+7 (3012) 21-47-47" disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="budget@khural.ru" disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item label="Адрес" name="address">
            <Input placeholder="г. Улан-Удэ, ул. Ленина, 54" disabled={loading || saving} />
          </Form.Item>

          <Form.Item
            label="Активность"
            name="isActive"
            valuePropName="checked"
            tooltip="Активный комитет отображается на сайте"
          >
            <Switch disabled={loading || saving} />
            <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
              {form.getFieldValue("isActive") ? "Активный" : "Неактивный"}
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}

