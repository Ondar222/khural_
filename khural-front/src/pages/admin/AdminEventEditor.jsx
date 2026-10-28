import React from "react";
import { App, Button, Form, Input } from "antd";
import { useHashRoute } from "../../Router.jsx";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { stripHtmlTags, decodeHtmlEntities } from "../../utils/html.js";
import { EventsApi } from "../../api/client.js";
import { useTranslation } from "../../hooks/index.js";
import { useI18n } from "../../context/I18nContext.jsx";

export default function AdminEventEditor({ mode, eventId, items, onCreate, onUpdate, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const { t } = useI18n();
  const [form] = Form.useForm();
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(mode === "edit");

  const {
    translate,
    loading: translating,
    error: translationError,
    clearError,
  } = useTranslation({ defaultFrom: "ru", defaultTo: "tyv" });

  const titleValue = Form.useWatch("title", form);

  React.useEffect(() => {
    if (translationError) {
      message.error(t("adminTranslateError") + ": " + (translationError?.message || ""));
      clearError();
    }
  }, [translationError, message, clearError, t]);

  // Пустой HTML (теги, &nbsp;) не считаем заполненным текстом
  const hasText = (value) =>
    String(value || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim().length > 0;

  const handleTranslateToTy = async () => {
    const values = form.getFieldsValue();
    const title = String(values.title || "").trim();
    const place = String(values.place || "").trim();
    const desc = String(values.desc || "").trim();

    if (!hasText(title) && !hasText(desc)) {
      message.warning(t("adminTranslateEmptySource"));
      return;
    }

    try {
      const [titleRes, placeRes, descRes] = await Promise.all([
        hasText(title) ? translate(title, "ru", "tyv") : Promise.resolve({ translated: "" }),
        hasText(place) ? translate(place, "ru", "tyv") : Promise.resolve({ translated: "" }),
        hasText(desc) ? translate(desc, "ru", "tyv") : Promise.resolve({ translated: "" }),
      ]);
      form.setFieldsValue({
        titleTy: String(titleRes?.translated || "").trim() || String(values.titleTy || ""),
        placeTy: String(placeRes?.translated || "").trim() || String(values.placeTy || ""),
        descTy: String(descRes?.translated || "").trim() || String(values.descTy || ""),
      });
      message.success(t("adminTranslateDone"));
    } catch (err) {
      console.error("Event translate error:", err);
      message.error(t("adminTranslateError") + ": " + (err?.message || ""));
    }
  };

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
                placeTy: apiEvent?.locationTy || apiEvent?.placeTy || apiEvent?.event_place_ty || "",
                title: apiEvent?.title || "",
                titleTy: apiEvent?.titleTy || apiEvent?.event_title_ty || "",
                desc: apiEvent?.description || apiEvent?.desc || "",
                descTy: apiEvent?.descriptionTy || apiEvent?.descTy || apiEvent?.event_description_ty || "",
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
        placeTy: found.placeTy || "",
        title: found.title || "",
        titleTy: found.titleTy || "",
          desc: descValue,
          descTy: (() => {
            if (!found.descTy) return "";
            const s = String(found.descTy);
            return /<[^>]+>/.test(s) ? decodeHtmlEntities(s) : s;
          })(),
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
              placeTy: updatedEvent?.locationTy || updatedEvent?.placeTy || "",
              title: updatedEvent?.title || "",
              titleTy: updatedEvent?.titleTy || "",
              desc: descValue,
              descTy: (() => {
                const d = updatedEvent?.descriptionTy || updatedEvent?.descTy || "";
                return /<[^>]+>/.test(String(d)) ? decodeHtmlEntities(String(d)) : String(d);
              })(),
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
            <div className="admin-events-editor__kicker">{t("adminEventsEditorKicker")}</div>
            <div className="admin-events-editor__title">
              {mode === "create" ? t("adminEventCreate") : t("adminEventEdit")}
            </div>
            {mode === "edit" && titleValue ? (
              <div className="admin-events-editor__subtitle">{String(titleValue)}</div>
            ) : (
              <div className="admin-events-editor__subtitle">{t("adminEventSubtitle")}</div>
            )}
          </div>
          <div className="admin-events-editor__hero-actions">
            <Button onClick={() => navigate("/admin/events")}>{t("adminCancel")}</Button>
            <Button type="primary" onClick={onSave} disabled={!canWrite} loading={Boolean(busy || saving)}>
              {t("adminSave")}
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-events-editor__section-title">{t("adminEventDetails")}</div>
        <Form
          layout="vertical"
          form={form}
          initialValues={{ date: new Date().toISOString().slice(0, 10) }}
        >
          <Form.Item label={t("adminEventDate")} name="date" rules={[{ required: true, message: t("adminEventDateRequired") }]}>
            <Input type="date" disabled={loading || saving} />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label={t("adminEventTime")} name="time">
              <Input placeholder={t("adminEventTimePlaceholder")} disabled={loading || saving} />
            </Form.Item>
            <Form.Item label={t("adminEventPlace")} name="place">
              <Input placeholder={t("adminEventPlacePlaceholder")} disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item label={t("adminEventTitle")} name="title" rules={[{ required: true, message: t("adminEventTitleRequired") }]}>
            <Input disabled={loading || saving} />
          </Form.Item>

          <Form.Item 
            label={t("adminEventDesc")} 
            name="desc"
            getValueFromEvent={(value) => value}
          >
            <TinyMCEEditor
              height={400}
              placeholder={t("adminEventDescPlaceholder")}
              disabled={loading || saving}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1px solid rgba(10, 31, 68, 0.08)",
            }}
          >
            <div className="admin-events-editor__section-title" style={{ marginBottom: 0 }}>
              {t("adminEventTyDetails")}
            </div>
            <Button
              type="default"
              onClick={handleTranslateToTy}
              loading={translating}
              disabled={!canWrite || translating || loading || saving}
            >
              {t("adminTranslateToTy")}
            </Button>
          </div>

          <Form.Item label={t("adminEventTitleTy")} name="titleTy">
            <Input placeholder={t("adminEventTitleTyPlaceholder")} disabled={loading || saving} />
          </Form.Item>

          <Form.Item label={t("adminEventPlaceTy")} name="placeTy">
            <Input placeholder={t("adminEventPlaceTyPlaceholder")} disabled={loading || saving} />
          </Form.Item>

          <Form.Item
            label={t("adminEventDescTy")}
            name="descTy"
            getValueFromEvent={(value) => value}
          >
            <TinyMCEEditor
              height={300}
              placeholder={t("adminEventDescTyPlaceholder")}
              disabled={loading || saving}
            />
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}


