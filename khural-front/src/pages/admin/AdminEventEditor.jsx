import React from "react";
import { App, Button, Form, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { stripHtmlTags, decodeHtmlEntities } from "../../utils/html.js";
import { EventsApi } from "../../api/client.js";

export default function AdminEventEditor({ mode, eventId, items, onCreate, onUpdate, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(mode === "edit");

  const titleValue = Form.useWatch("title", form);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(eventId || "");
    if (!id) return;
    
    const loadEvent = async () => {
      setLoading(true);
      try {
        // Сначала ищем в переданном списке items
        let found = (Array.isArray(items) ? items : []).find((e) => String(e?.id) === id) || null;
        
        // Если не найдено в списке, загружаем из API
        if (!found) {
          try {
            const apiEvent = await EventsApi.getById(id);
            if (apiEvent) {
              // Преобразуем данные из API в формат формы (используем ту же логику, что и toEventRow)
              const start = apiEvent?.startDate ? new Date(Number(apiEvent.startDate)) : null;
              const date = start && !isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : apiEvent?.date || "";
              const time = start && !isNaN(start.getTime()) ? start.toISOString().slice(11, 16) : apiEvent?.time || "";
              
              found = {
                id: apiEvent.id,
                date,
                time,
                place: apiEvent?.location || apiEvent?.place || "",
                title: apiEvent?.title || "",
                desc: apiEvent?.description || apiEvent?.desc || "",
              };
            }
          } catch (error) {
            console.error("Failed to load event from API:", error);
            message.error("Не удалось загрузить событие");
            return;
          }
        }
        
        if (!found) {
          message.error("Событие не найдено");
          return;
        }
        
        // Убеждаемся, что дата и время правильно извлечены
        // Если found уже из items, он уже преобразован через toEventRow
        // Но если есть __raw, можем использовать его для более точного извлечения
        let dateValue = found.date || "";
        let timeValue = found.time || "";
        
        // Если дата/время пустые, но есть __raw с startDate, извлекаем оттуда
        if ((!dateValue || !timeValue) && found.__raw) {
          const raw = found.__raw;
          const start = raw?.startDate ? new Date(Number(raw.startDate)) : null;
          if (start && !isNaN(start.getTime())) {
            dateValue = start.toISOString().slice(0, 10);
            timeValue = start.toISOString().slice(11, 16);
          }
        }
        
        // Обрабатываем описание: если есть HTML, декодируем entities, но оставляем HTML для TinyMCE
        let descValue = "";
        if (found.desc) {
          const descStr = String(found.desc);
          if (/<[^>]+>/.test(descStr)) {
            descValue = decodeHtmlEntities(descStr);
          } else {
            descValue = descStr;
          }
        }
        
        form.setFieldsValue({
          date: dateValue,
          time: timeValue,
          place: found.place || "",
          title: found.title || "",
          desc: descValue,
        });
      } catch (error) {
        console.error("Error loading event:", error);
        message.error("Ошибка при загрузке события");
      } finally {
        setLoading(false);
      }
    };
    
    loadEvent();
  }, [mode, eventId, items, form, message]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = { ...values, desc: values.desc || "" };
      if (mode === "create") {
        await onCreate?.(payload);
        message.success("Событие создано");
        navigate("/admin/events");
      } else {
        await onUpdate?.(String(eventId), payload);
        message.success("Событие обновлено");
        
        // После успешного сохранения загружаем обновленные данные
        try {
          const updatedEvent = await EventsApi.getById(eventId);
          if (updatedEvent) {
            // Извлекаем дату и время из startDate (timestamp в миллисекундах)
            const start = updatedEvent?.startDate ? new Date(Number(updatedEvent.startDate)) : null;
            let dateValue = "";
            let timeValue = "";
            
            if (start && !isNaN(start.getTime())) {
              dateValue = start.toISOString().slice(0, 10);
              timeValue = start.toISOString().slice(11, 16);
            } else {
              // Fallback на прямые поля, если startDate нет
              dateValue = updatedEvent?.date || "";
              timeValue = updatedEvent?.time || "";
            }
            
            let descValue = "";
            if (updatedEvent?.description || updatedEvent?.desc) {
              const descStr = String(updatedEvent?.description || updatedEvent?.desc || "");
              if (/<[^>]+>/.test(descStr)) {
                descValue = decodeHtmlEntities(descStr);
              } else {
                descValue = descStr;
              }
            }
            
            form.setFieldsValue({
              date: dateValue,
              time: timeValue,
              place: updatedEvent?.location || updatedEvent?.place || "",
              title: updatedEvent?.title || "",
              desc: descValue,
            });
          }
        } catch (error) {
          console.warn("Could not reload updated event:", error);
        }
        
        navigate("/admin/events");
      }
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

          <Form.Item 
            label="Описание" 
            name="desc"
            getValueFromEvent={(value) => value}
          >
            <TinyMCEEditor
              height={400}
              placeholder="Описание события"
              disabled={loading || saving}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}


