import React from "react";
import { App, Button, Input, Form, Upload, Space, Select, Switch, Card, Divider, Alert } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { DocumentsApi, TranslationApi } from "../../api/client.js";

const TYPE_OPTIONS = [
  { value: "laws", label: "Законы" },
  { value: "resolutions", label: "Постановления" },
  { value: "initiatives", label: "Инициативы" },
  { value: "bills", label: "Законопроекты" },
  { value: "civic", label: "Обращения" },
  { value: "constitution", label: "Конституция" },
  { value: "other", label: "Другое" },
];

export default function AdminDocumentsEdit({ documentId, onUpdate, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const [fileRu, setFileRu] = React.useState(null);
  const [fileTy, setFileTy] = React.useState(null);
  const [documentData, setDocumentData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [translating, setTranslating] = React.useState(false);
  const [translationJob, setTranslationJob] = React.useState(null);
  const [translationStatus, setTranslationStatus] = React.useState(null);

  // Загружаем данные документа
  React.useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return;
      setLoading(true);
      try {
        const doc = await DocumentsApi.getById(documentId);
        setDocumentData(doc);

        // Заполняем форму
        form.setFieldsValue({
          title: doc.title || "",
          type: doc.type || "laws",
          description: doc.content || "",
          category: doc.metadata?.category || "",
          number: doc.number || "",
          date: doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString("ru-RU") : "",
          isPublished: doc.isPublished ?? false,
        });
      } catch (error) {
        console.error("Failed to load document:", error);
        antdMessage.error("Не удалось загрузить документ");
        navigate("/admin/documents");
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [documentId, form, navigate, antdMessage]);

  // Проверяем статус перевода, если есть активная задача
  React.useEffect(() => {
    if (!translationJob?.id) return;

    const checkStatus = async () => {
      try {
        const status = await TranslationApi.getTranslationStatus(translationJob.id);
        setTranslationStatus(status);
        
        if (status.status === "completed") {
          antdMessage.success("Перевод завершен и файл добавлен к документу");
          setTranslationJob(null);
          // Перезагружаем документ, чтобы увидеть новый файл
          try {
            const doc = await DocumentsApi.getById(documentId);
            setDocumentData(doc);
          } catch (error) {
            console.error("Failed to reload document:", error);
          }
        } else if (status.status === "failed") {
          antdMessage.error("Перевод не удался");
          setTranslationJob(null);
        }
      } catch (error) {
        console.error("Failed to check translation status:", error);
        setTranslationJob(null);
        setTranslationStatus(null);
        antdMessage.error("Не удалось проверить статус перевода");
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [translationJob, antdMessage, documentId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Проверяем, что хотя бы один файл загружен (новый или существующий)
      const hasExistingFiles = documentData?.pdfFile || documentData?.metadata?.pdfFileTyId;
      if (!fileRu && !fileTy && !hasExistingFiles) {
        antdMessage.error("Загрузите хотя бы один файл (русская или тувинская версия)");
        return;
      }
      await onUpdate?.(documentId, { ...values, fileRu, fileTy });
      navigate("/admin/documents");
    } catch (error) {
      if (error?.errorFields) return;
      antdMessage.error(error?.message || "Не удалось обновить документ");
    }
  };

  const [translateFrom, setTranslateFrom] = React.useState("ru");
  const [translateTo, setTranslateTo] = React.useState("tyv");

  const handleTranslate = async () => {
    // Определяем, какой файл использовать для перевода
    // Если переводим с русского, используем русский файл
    // Если переводим с тувинского, используем тувинский файл
    let fileId = null;
    
    if (translateFrom === "ru") {
      // Переводим с русского - используем русский файл
      fileId = documentData?.pdfFile?.id;
    } else if (translateFrom === "tyv") {
      // Переводим с тувинского - используем тувинский файл
      fileId = documentData?.metadata?.pdfFileTyId;
    }

    if (!fileId) {
      const fileType = translateFrom === "ru" ? "русский" : "тувинский";
      antdMessage.warning(`Для перевода необходим загруженный ${fileType} файл (PDF или DOCX)`);
      return;
    }

    if (translateFrom === translateTo) {
      antdMessage.warning("Языки источника и перевода должны отличаться");
      return;
    }

    try {
      setTranslating(true);

      // Используем новый метод для перевода по ID файла
      const result = await TranslationApi.translateDocumentByFileId(
        fileId,
        translateFrom,
        translateTo,
        documentId
      );

      setTranslationJob(result);
      setTranslationStatus({ status: "processing" });
      antdMessage.success("Запрос на перевод отправлен");
    } catch (error) {
      console.error("Translation error:", error);
      antdMessage.error(error?.message || "Не удалось отправить запрос на перевод");
    } finally {
      setTranslating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ width: "100%", padding: "24px", textAlign: "center" }}>
        <p>Загрузка данных документа...</p>
      </div>
    );
  }

  const pdfUrlRu = documentData?.pdfFile?.link;
  const pdfUrlTy = documentData?.metadata?.pdfFileTyLink;

  return (
    <div style={{ width: "100%", padding: "24px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Редактирование документа</h1>
        <Space>
          <Button onClick={() => navigate("/admin/documents")}>Отмена</Button>
          <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
            Сохранить
          </Button>
        </Space>
      </div>

      {/* Просмотр PDF */}
      {(pdfUrlRu || pdfUrlTy) && (
        <Card title="Просмотр документов" style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: pdfUrlRu && pdfUrlTy ? "1fr 1fr" : "1fr", gap: 16 }}>
            {pdfUrlRu && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Русская версия</h4>
                <Button
                  type="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(pdfUrlRu, "_blank");
                  }}
                  style={{ marginBottom: 16 }}
                >
                  Открыть в новой вкладке
                </Button>
                <div style={{ border: "1px solid #d9d9d9", borderRadius: "4px", overflow: "hidden" }}>
                  <iframe
                    src={pdfUrlRu}
                    style={{
                      width: "100%",
                      height: "600px",
                      border: "none",
                    }}
                    title="PDF Preview RU"
                  />
                </div>
              </div>
            )}
            {pdfUrlTy && (
              <div>
                <h4 style={{ marginBottom: 8 }}>Тувинская версия</h4>
                <Button
                  type="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(pdfUrlTy, "_blank");
                  }}
                  style={{ marginBottom: 16 }}
                >
                  Открыть в новой вкладке
                </Button>
                <div style={{ border: "1px solid #d9d9d9", borderRadius: "4px", overflow: "hidden" }}>
                  <iframe
                    src={pdfUrlTy}
                    style={{
                      width: "100%",
                      height: "600px",
                      border: "none",
                    }}
                    title="PDF Preview TY"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Форма перевода */}
      <Card title="Перевод документа" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Язык источника</label>
            <Select
              value={translateFrom}
              style={{ width: "100%" }}
              onChange={setTranslateFrom}
            >
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="tyv">Тувинский</Select.Option>
            </Select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Язык перевода</label>
            <Select
              value={translateTo}
              style={{ width: "100%" }}
              onChange={setTranslateTo}
            >
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="tyv">Тувинский</Select.Option>
            </Select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <Button
              type="primary"
              onClick={handleTranslate}
              loading={translating}
              disabled={!canWrite || (!documentData?.pdfFile?.id && !documentData?.metadata?.pdfFileTyId) || translating}
              style={{ width: "100%" }}
            >
              Запросить перевод
            </Button>
          </div>
        </div>
        {translationStatus && (
          <Alert
            message={
              translationStatus.status === "processing"
                ? "Перевод выполняется..."
                : translationStatus.status === "completed"
                ? "Перевод завершен"
                : translationStatus.status === "failed"
                ? "Перевод не удался"
                : `Статус: ${translationStatus.status}`
            }
            type={
              translationStatus.status === "completed"
                ? "success"
                : translationStatus.status === "failed"
                ? "error"
                : "info"
            }
            style={{ marginTop: 16 }}
          />
        )}
        {!documentData?.pdfFile?.id && !documentData?.metadata?.pdfFileTyId && (
          <Alert
            message="Для перевода необходимо загрузить PDF или DOCX файл"
            type="warning"
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Divider />

      {/* Форма редактирования */}
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Название"
          name="title"
          rules={[{ required: true, message: "Укажите название" }]}
        >
          <Input />
        </Form.Item>

        <div className="admin-split">
          <Form.Item label="№" name="number">
            <Input />
          </Form.Item>
          <Form.Item label="Дата" name="date">
            <Input />
          </Form.Item>
        </div>

        <Form.Item label="Категория" name="category">
          <Input />
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
              {pdfUrlRu && !fileRu && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                  Текущий файл: <a 
                    href={pdfUrlRu} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(pdfUrlRu, "_blank");
                    }}
                  >открыть</a>
                </div>
              )}
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
              {pdfUrlTy && !fileTy && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                  Текущий файл: <a 
                    href={pdfUrlTy} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(pdfUrlTy, "_blank");
                    }}
                  >открыть</a>
                </div>
              )}
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

