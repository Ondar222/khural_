import React from "react";
import { App, Button, Input, Form, Upload, Space, Select, Switch } from "antd";
import { useHashRoute } from "../../Router.jsx";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "other", label: "Другое" },
];

export default function AdminDocumentsCreate({ onCreate, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const [fileRu, setFileRu] = React.useState(null);
  const [fileTy, setFileTy] = React.useState(null);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!fileRu && !fileTy) {
        antdMessage.error("Загрузите хотя бы один файл (русская или тувинская версия)");
        return;
      }
      await onCreate({ ...values, fileRu, fileTy });
      navigate("/admin/documents");
    } catch (error) {
      if (error?.errorFields) return;
      antdMessage.error(error?.message || "Не удалось создать документ");
    }
  };

  return (
    <div style={{ width: "100%", padding: "24px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Создание документа</h1>
        <Space>
          <Button onClick={() => navigate("/admin/documents")}>Отмена</Button>
          <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
            Сохранить
          </Button>
        </Space>
      </div>

      <Form layout="vertical" form={form} initialValues={{ type: "laws", isPublished: false }}>
        <Form.Item
          label="Название"
          name="title"
          rules={[{ required: true, message: "Укажите название" }]}
        >
          <Input />
        </Form.Item>

        <div className="admin-split">
          <Form.Item label="№" name="number">
            <Input placeholder="№58-ЗРТ" />
          </Form.Item>
          <Form.Item label="Дата" name="date">
            <Input placeholder="22.10.2025" />
          </Form.Item>
        </div>

        <Form.Item label="Категория" name="category">
          <Input placeholder="Законы / Постановления / ..." />
        </Form.Item>

        <Form.Item label="Тип" name="type">
          <Select options={TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item label="Описание" name="description">
          <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
        </Form.Item>

        <Form.Item
          label="Опубликовано"
          name="isPublished"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Файлы документа</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              label="Русская версия (PDF/DOCX)"
              help="Загрузите хотя бы один файл"
            >
              <Upload
                maxCount={1}
                accept=".pdf,.docx"
                beforeUpload={(f) => {
                  setFileRu(f);
                  return false;
                }}
                onRemove={() => setFileRu(null)}
              >
                <Button>Выбрать файл</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              label="Тувинская версия (PDF/DOCX)"
              help="Загрузите хотя бы один файл"
            >
              <Upload
                maxCount={1}
                accept=".pdf,.docx"
                beforeUpload={(f) => {
                  setFileTy(f);
                  return false;
                }}
                onRemove={() => setFileTy(null)}
              >
                <Button>Выбрать файл</Button>
              </Upload>
            </Form.Item>
          </div>
        </div>
      </Form>

      {!canWrite ? (
        <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 4, color: "#856404" }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </div>
  );
}

