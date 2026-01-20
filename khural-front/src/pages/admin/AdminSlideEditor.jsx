import React from "react";
import { App, Button, Form, Input, Space, Switch, Upload } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { SliderApi } from "../../api/client.js";

function splitDateAndDescription(desc) {
  const s = String(desc || "");
  const m = s.match(/^\s*(?:Дата события|Дата)\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\n?/i);
  if (!m) return { date: "", description: s };
  const date = m[1] || "";
  const rest = s.slice(m[0].length);
  return { date, description: rest.trimStart() };
}

function joinDateAndDescription(date, description) {
  const d = String(date || "").trim();
  const body = String(description || "").trim();
  if (!d) return body;
  return `Дата события: ${d}${body ? `\n${body}` : ""}`;
}

function pickText(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (!s) continue;
    return s;
  }
  return "";
}

export default function AdminSlideEditor({ mode, slideId, items, onCreate, onUpdate, onUploadImage, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [imageFile, setImageFile] = React.useState(null);
  const titleValue = Form.useWatch("title", form);
  const descriptionHtml = Form.useWatch("description", form);

  React.useEffect(() => {
    if (mode !== "edit") return;
    const id = String(slideId || "");
    if (!id) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const local =
          (Array.isArray(items) ? items : []).find((s) => String(s?.id) === String(id)) || null;
        const fromApi = await SliderApi.getById(id).catch(() => null);

        // Merge carefully: API may return partial/empty object; do not wipe local values with empty strings.
        const title = pickText(fromApi?.title, local?.title);
        const descriptionRaw = pickText(
          fromApi?.description,
          fromApi?.desc,
          fromApi?.subtitle,
          local?.description,
          local?.desc,
          local?.subtitle
        );
        const url = pickText(fromApi?.url, fromApi?.link, fromApi?.href, local?.url, local?.link, local?.href);
        const isActive =
          fromApi && typeof fromApi === "object" && Object.prototype.hasOwnProperty.call(fromApi, "isActive")
            ? fromApi.isActive !== false
            : local
              ? local.isActive !== false
              : true;

        const dateSplit = splitDateAndDescription(descriptionRaw);
        form.setFieldsValue({
          title: title || "",
          date: dateSplit.date || "",
          description: dateSplit.description || "",
          url: url || "",
          isActive,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mode, slideId, items, form]);

  const onSave = async () => {
    if (!canWrite) return;
    setSaving(true);
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        description: joinDateAndDescription(values.date, values.description || ""),
        url: values.url,
        isActive: values.isActive,
      };

      if (mode === "create") {
        const existingCount = Array.isArray(items) ? items.length : 0;
        if (existingCount >= 5) {
          message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
          return;
        }
        const created = await onCreate?.(payload);
        // If API returned created object with id - upload image
        const createdId = created?.id;
        if (createdId && imageFile) await onUploadImage?.(createdId, imageFile);
        message.success("Слайд создан");
        navigate("/admin/slider");
        return;
      }

      const id = String(slideId || "");
      if (!id) throw new Error("Не удалось определить ID слайда");
      await onUpdate?.(id, payload);
      if (imageFile) await onUploadImage?.(id, imageFile);
      message.success("Слайд обновлён");
      navigate("/admin/slider");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Не удалось сохранить слайд");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-slider-editor">
      <div className="admin-slider-editor__hero">
        <div className="admin-slider-editor__hero-row">
          <div className="admin-slider-editor__hero-left">
            <div className="admin-slider-editor__kicker">Слайдер</div>
            <div className="admin-slider-editor__title">
              {mode === "create" ? "Создать слайд" : "Редактировать слайд"}
            </div>
            {mode === "edit" && titleValue ? (
              <div className="admin-slider-editor__subtitle">{String(titleValue)}</div>
            ) : (
              <div className="admin-slider-editor__subtitle">Важные объявления на главной</div>
            )}
          </div>
          <div className="admin-slider-editor__hero-actions">
            <Button onClick={() => navigate("/admin/slider")}>Отмена</Button>
            <Button type="primary" onClick={onSave} disabled={!canWrite} loading={Boolean(busy || saving)}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-slider-editor__section-title">Данные слайда</div>
        <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
          <div className="admin-split">
            <Form.Item label="Заголовок" name="title" rules={[{ required: true, message: "Укажите заголовок" }]}>
              <Input disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Дата события" name="date" rules={[{ required: true, message: "Укажите дату события" }]}>
              <Input type="date" disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item
            label="Описание (HTML)"
            name="description"
            tooltip="Вставьте HTML (p, h1-h6, strong/em, a, ul/ol/li, img и т.д.)"
          >
            <Input.TextArea
              autoSize={{ minRows: 10, maxRows: 24 }}
              placeholder="<p>Описание</p>"
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              disabled={loading || saving}
            />
          </Form.Item>

          <div className="admin-split">
            <Form.Item label="Ссылка" name="url">
              <Input disabled={loading || saving} placeholder="/news?id=123 или https://..." />
            </Form.Item>
            <Form.Item label="Активен" name="isActive" valuePropName="checked">
              <Switch disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item label="Картинка слайда" tooltip="Загружается через API /slider/{id}/image">
            <Upload
              accept={undefined}
              maxCount={1}
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              showUploadList={true}
            >
              <Button disabled={loading || saving}>Выбрать картинку</Button>
            </Upload>
            <div className="admin-hint">
              Картинка применится после сохранения. В списке можно быстро заменить через кнопку «Картинка».
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}


