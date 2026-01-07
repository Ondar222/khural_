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
    <div className="admin-doc-editor">
      <div className="admin-doc-editor__hero">
        <div className="admin-doc-editor__hero-row">
          <div className="admin-doc-editor__hero-left">
            <div className="admin-doc-editor__kicker">Документы</div>
            <div className="admin-doc-editor__title">Создание документа</div>
            <div className="admin-doc-editor__subtitle">Заполните поля и загрузите файл (RU и/или TY)</div>
          </div>
          <div className="admin-doc-editor__hero-actions">
            <Button onClick={() => navigate("/admin/documents")}>Отмена</Button>
            <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <Form layout="vertical" form={form} initialValues={{ type: "laws", isPublished: false }}>
        <div className="admin-doc-editor__grid">
          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Основное</div>
            <Form.Item label="Название" name="title" rules={[{ required: true, message: "Укажите название" }]}>
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
          </div>

          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Публикация</div>
            <Form.Item label="Опубликовано" name="isPublished" valuePropName="checked">
              <Switch />
            </Form.Item>
            <div className="admin-hint">
              Документ появится на сайте только если опубликован (или если вы используете предпросмотр).
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-doc-editor__section-title">Файлы документа</div>
          <div className="admin-doc-editor__files-grid">
            <Form.Item label="Русская версия (PDF/DOCX)" help="Загрузите хотя бы один файл">
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
            <Form.Item label="Тувинская версия (PDF/DOCX)" help="Загрузите хотя бы один файл">
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
        <div className="admin-card" style={{ marginTop: 16, background: "#fff3cd", color: "#856404" }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </div>
  );
}

