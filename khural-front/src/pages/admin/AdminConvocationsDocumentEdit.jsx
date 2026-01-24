import React from "react";
import { App, Button, Form, Input, Select, Upload, DatePicker } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { ConvocationsApi, CommitteesApi, DocumentsApi, API_BASE_URL, getAuthToken } from "../../api/client.js";
import dayjs from "dayjs";

const CATEGORY_OPTIONS = [
  { value: "agenda", label: "Повестка" },
  { value: "report", label: "Отчет" },
];

export default function AdminConvocationsDocumentEdit({ 
  convocationId, 
  documentId, 
  onUpdate, 
  busy, 
  canWrite 
}) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [file, setFile] = React.useState(null);
  const [fileId, setFileId] = React.useState(null);
  const [committees, setCommittees] = React.useState([]);
  const [convocation, setConvocation] = React.useState(null);
  const [documentData, setDocumentData] = React.useState(null);

  // Загружаем комитеты
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const comms = await CommitteesApi.list({ all: true }).catch(() => []);
        if (!alive) return;
        setCommittees(Array.isArray(comms) ? comms : []);
      } catch (error) {
        console.error("Failed to load committees:", error);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Загружаем данные созыва и документа
  React.useEffect(() => {
    if (!convocationId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const conv = await ConvocationsApi.getById(convocationId).catch(() => null);
        if (!conv) {
          message.error("Созыв не найден");
          navigate("/admin/convocations/documents");
          return;
        }
        
        setConvocation(conv);
        const docs = Array.isArray(conv.documents) ? conv.documents : [];
        
        if (documentId) {
          // Редактирование существующего документа
          const doc = docs.find(d => String(d.id) === String(documentId));
          if (!doc) {
            message.error("Документ не найден");
            navigate("/admin/convocations/documents");
            return;
          }
          
          setDocumentData(doc);
          setFileId(doc.fileId || null);
          
          // Преобразуем дату для DatePicker
          let dateValue = null;
          if (doc.date) {
            // Пробуем разные форматы даты
            if (doc.date.includes(".")) {
              // Формат дд.мм.гггг
              const [day, month, year] = doc.date.split(".");
              dateValue = dayjs(`${year}-${month}-${day}`);
            } else {
              dateValue = dayjs(doc.date);
            }
          }
          
          form.setFieldsValue({
            category: doc.category || "report",
            title: doc.title || "",
            date: dateValue,
            committeeId: doc.committeeId || undefined,
          });
        } else {
          // Создание нового документа
          form.setFieldsValue({
            category: "report",
            date: dayjs(),
          });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        message.error("Не удалось загрузить данные");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [convocationId, documentId, form, navigate, message]);

  const handleSubmit = async () => {
    if (!canWrite || !convocation) return;
    
    setSaving(true);
    try {
      const values = await form.validateFields();
      
      // Загружаем файл, если он был выбран
      let finalFileId = fileId;
      if (file) {
        try {
          // Используем DocumentsApi для загрузки файла
          // Создаем временный документ для загрузки файла
          const tempDoc = await DocumentsApi.create({
            title: `[Временный] ${values.title || "Документ созыва"}`,
            type: "other",
            isPublished: false,
          });
          
          if (!tempDoc || !tempDoc.id) {
            throw new Error("Не удалось создать временный документ для загрузки файла");
          }
          
          // Загружаем файл в документ
          await DocumentsApi.uploadFile(tempDoc.id, file);
          
          // Получаем обновленный документ с информацией о файле
          const updatedDoc = await DocumentsApi.getById(tempDoc.id);
          
          // Извлекаем fileId из ответа (структура как в AdminDocumentsEdit)
          finalFileId = updatedDoc?.pdfFile?.id;
          
          if (!finalFileId) {
            // Если не удалось получить fileId, удаляем временный документ
            try {
              await DocumentsApi.remove(tempDoc.id);
            } catch (e) {
              console.warn("Failed to delete temp document:", e);
            }
            throw new Error("Не удалось получить ID загруженного файла. Структура ответа: " + JSON.stringify(updatedDoc, null, 2));
          }
          
          message.success("Файл загружен");
          
          // ВАЖНО: Не удаляем временный документ, так как файл привязан к нему
          // Файл будет доступен через fileId, а документ можно будет удалить позже вручную
        } catch (error) {
          console.error("Failed to upload file:", error);
          console.error("Error details:", {
            message: error?.message,
            status: error?.status,
            data: error?.data,
          });
          message.error(error?.message || "Не удалось загрузить файл");
          setSaving(false);
          return;
        }
      }
      
      // Форматируем дату
      const dateValue = values.date ? values.date.format("YYYY-MM-DD") : "";
      
      const docData = {
        id: documentId || `doc-${Date.now()}`,
        category: values.category,
        date: dateValue,
        title: values.title,
        fileId: finalFileId || undefined,
        committeeId: values.committeeId || undefined,
      };

      const updatedDocs = documentId
        ? (convocation.documents || []).map(d => String(d.id) === String(documentId) ? docData : d)
        : [...(convocation.documents || []), docData];

      const updatedConvocation = {
        ...convocation,
        documents: updatedDocs,
      };

      await ConvocationsApi.patch(convocation.id, updatedConvocation);
      message.success(documentId ? "Документ обновлен" : "Документ добавлен");
      // Возвращаемся на страницу списка с сохранением выбранного созыва
      navigate(`/admin/convocations/documents?convocation=${convocation.id}`);
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || "Не удалось сохранить документ");
    } finally {
      setSaving(false);
    }
  };

  const committeeOptions = React.useMemo(() => {
    return committees.map(c => ({
      value: String(c.id),
      label: c.title || c.name || String(c.id),
    }));
  }, [committees]);

  if (loading) {
    return (
      <div className="admin-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontWeight: 900 }}>Загрузка данных…</div>
      </div>
    );
  }

  return (
    <div className="admin-convocations-document-editor">
      <div className="admin-doc-editor__hero">
        <div className="admin-doc-editor__hero-row">
          <div className="admin-doc-editor__hero-left">
            <div className="admin-doc-editor__kicker">Документы созывов</div>
            <div className="admin-doc-editor__title">
              {documentId ? "Редактировать документ" : "Добавить документ"}
            </div>
            {convocation && (
              <div className="admin-doc-editor__subtitle">
                {convocation.name || convocation.number || `Созыв ${convocation.id}`}
              </div>
            )}
          </div>
          <div className="admin-doc-editor__hero-actions">
            <Button onClick={() => navigate("/admin/convocations/documents")}>Отмена</Button>
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              disabled={!canWrite} 
              loading={busy || saving}
            >
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <Form layout="vertical" form={form}>
        <div className="admin-doc-editor__grid">
          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Основное</div>
            
            <Form.Item
              label="Категория"
              name="category"
              rules={[{ required: true, message: "Выберите категорию" }]}
            >
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>

            <Form.Item
              label="Название документа"
              name="title"
              rules={[{ required: true, message: "Введите название" }]}
            >
              <Input placeholder="Например: Повестка заседания комитета от 09.02.2023 г." />
            </Form.Item>

            <Form.Item
              label="Дата"
              name="date"
              rules={[{ required: true, message: "Введите дату" }]}
            >
              <DatePicker 
                style={{ width: "100%" }}
                format="DD.MM.YYYY"
                placeholder="Выберите дату"
              />
            </Form.Item>

            <Form.Item
              label="Комитет"
              name="committeeId"
            >
              <Select
                placeholder="Выберите комитет (опционально)"
                allowClear
                showSearch
                optionFilterProp="label"
                options={committeeOptions}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-doc-editor__section-title">Файл документа</div>
            
            <Form.Item
              label="Загрузка документа"
              help="Загрузите файл документа (PDF, DOC, DOCX)"
            >
              <Upload
                maxCount={1}
                accept=".pdf,.doc,.docx"
                beforeUpload={(f) => {
                  setFile(f);
                  return false;
                }}
                onRemove={() => {
                  setFile(null);
                }}
                fileList={file ? [{
                  uid: file.uid || '1',
                  name: file.name,
                  status: 'done',
                }] : []}
              >
                <Button>Выбрать файл</Button>
              </Upload>
              {fileId && !file && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
                  Текущий файл: <a 
                    href={`${API_BASE_URL}/files/${fileId}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    открыть
                  </a>
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
