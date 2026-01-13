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
  const descriptionHtml = Form.useWatch("description", form);

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
      await onUpdate?.(documentId, { ...values, description: values.description || "", fileRu, fileTy });
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
      <div className="admin-doc-editor">
        <div className="admin-card" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900 }}>Загрузка данных документа…</div>
          <div className="admin-hint">Подождите, загружаем данные и файлы.</div>
        </div>
      </div>
    );
  }

  const pdfUrlRu = documentData?.pdfFile?.link;
  const pdfUrlTy = documentData?.metadata?.pdfFileTyLink;

  return (
    <div className="admin-doc-editor">
      <div className="admin-doc-editor__hero">
        <div className="admin-doc-editor__hero-row">
          <div className="admin-doc-editor__hero-left">
            <div className="admin-doc-editor__kicker">Документы</div>
            <div className="admin-doc-editor__title">Редактирование документа</div>
            {documentData?.title ? (
              <div className="admin-doc-editor__subtitle">{String(documentData.title)}</div>
            ) : null}
          </div>
          <div className="admin-doc-editor__hero-actions">
            <Button onClick={() => navigate("/admin/documents")}>Отмена</Button>
            <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      {/* Просмотр PDF */}
      {(pdfUrlRu || pdfUrlTy) && (
        <div className="admin-card">
          <div className="admin-doc-editor__section-title">Просмотр документов</div>
          <div
            className="admin-doc-editor__pdf-grid"
            style={{ gridTemplateColumns: pdfUrlRu && pdfUrlTy ? "1fr 1fr" : "1fr" }}
          >
            {pdfUrlRu && (
              <div className="admin-doc-editor__pdf-pane">
                <div className="admin-doc-editor__pdf-head">
                  <div style={{ fontWeight: 900 }}>Русская версия</div>
                  <Button
                    type="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(pdfUrlRu, "_blank");
                    }}
                  >
                    Открыть
                  </Button>
                </div>
                <div className="admin-doc-editor__pdf-frame">
                  <iframe src={pdfUrlRu} title="PDF Preview RU" />
                </div>
              </div>
            )}
            {pdfUrlTy && (
              <div className="admin-doc-editor__pdf-pane">
                <div className="admin-doc-editor__pdf-head">
                  <div style={{ fontWeight: 900 }}>Тувинская версия</div>
                  <Button
                    type="primary"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(pdfUrlTy, "_blank");
                    }}
                  >
                    Открыть
                  </Button>
                </div>
                <div className="admin-doc-editor__pdf-frame">
                  <iframe src={pdfUrlTy} title="PDF Preview TY" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Форма перевода */}
      <div className="admin-card">
        <div className="admin-doc-editor__section-title">Перевод документа</div>
        <div className="admin-doc-editor__triple-grid">
          <div>
            <label className="admin-doc-editor__label">Язык источника</label>
            <Select value={translateFrom} style={{ width: "100%" }} onChange={setTranslateFrom}>
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="tyv">Тувинский</Select.Option>
            </Select>
          </div>
          <div>
            <label className="admin-doc-editor__label">Язык перевода</label>
            <Select value={translateTo} style={{ width: "100%" }} onChange={setTranslateTo}>
              <Select.Option value="ru">Русский</Select.Option>
              <Select.Option value="tyv">Тувинский</Select.Option>
            </Select>
          </div>
          <div className="admin-doc-editor__triple-action">
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
      </div>

      {/* Форма редактирования */}
      <Form layout="vertical" form={form}>
        <div className="admin-doc-editor__grid">
          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Основное</div>
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
              <Input.TextArea
                autoSize={{ minRows: 6, maxRows: 18 }}
                placeholder="<p>Описание</p>"
                value={typeof descriptionHtml === "string" ? descriptionHtml : ""}
                onChange={(e) => form.setFieldValue("description", e.target.value)}
                disabled={loading || busy || !canWrite}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Публикация</div>
            <Form.Item label="Опубликовано" name="isPublished" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-doc-editor__section-title">Файлы документа</div>
          <div className="admin-doc-editor__files-grid">
            <Form.Item
              label="Русская версия (PDF/DOCX)"
              help="Загрузите хотя бы один файл"
            >
              <Upload
                maxCount={1}
                accept=".pdf,.doc,.docx"
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
                accept=".pdf,.doc,.docx"
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
        <div className="admin-card admin-card--warning" style={{ marginTop: 16 }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </div>
  );
}

