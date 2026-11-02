import React from "react";
import { App, Button, Form, Input, Switch, Upload } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { SliderApi } from "../../api/client.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";
import { useTranslation } from "../../hooks/index.js";
import { normalizeFilesUrl } from "../../utils/filesUrl.js";
import { readSliderOverrides } from "../../utils/sliderOverrides.js";

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

function getTyvContent(slide) {
  const content = Array.isArray(slide?.content) ? slide.content : [];
  return (
    content.find((entry) => ["tyv", "ty"].includes(String(entry?.locale || entry?.lang || "").toLowerCase())) ||
    null
  );
}

export default function AdminSlideEditor({ mode, slideId, items, onCreate, onUpdate, onUploadImage, onUploadImages, busy, canWrite }) {
  const { message } = App.useApp();
  const { navigate } = useHashRoute();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(mode === "edit");
  const [saving, setSaving] = React.useState(false);
  const [coverFile, setCoverFile] = React.useState(null);
  const [galleryFiles, setGalleryFiles] = React.useState([]);
  const [existingCover, setExistingCover] = React.useState("");
  const [existingGallery, setExistingGallery] = React.useState([]);
  const titleValue = Form.useWatch("title", form);
  const { translate, loading: translating, error: translationError, clearError } = useTranslation({ defaultFrom: "ru", defaultTo: "tyv" });

  React.useEffect(() => {
    if (translationError) {
      message.error("Ошибка при переводе: " + (translationError?.message || "Неизвестная ошибка"));
      clearError();
    }
  }, [translationError, message, clearError]);

  const handleTranslateToTy = async () => {
    try {
      const values = form.getFieldsValue();
      const title = String(values.title || "").trim();
      const description = String(values.description || "").trim();
      
      // Не переводим, если это URL или пусто
      const isUrl = /^(https?:\/\/|www\.|\/)/i.test(title);
      if (isUrl) {
        message.warning("Заголовок похож на ссылку — перевод не требуется");
        return;
      }
      
      if (!title && !description) {
        message.warning("Заполните заголовок или описание (RU) для перевода");
        return;
      }
      
      const [titleResult, descResult] = await Promise.all([
        title && !isUrl ? translate(title, "ru", "tyv") : Promise.resolve({ translated: "" }),
        description ? translate(description, "ru", "tyv") : Promise.resolve({ translated: "" }),
      ]);
      
      const translatedTitle = String(titleResult?.translated ?? "").trim();
      const translatedDesc = String(descResult?.translated ?? "").trim();
      
      form.setFieldsValue({
        titleTy: translatedTitle,
        descriptionTy: translatedDesc,
      });
      message.success("Перевод выполнен");
    } catch (err) {
      console.error("Slider translate error:", err);
      message.error("Ошибка перевода: " + (err?.message || "Неизвестная ошибка"));
    }
  };

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
        const overrides = readSliderOverrides();
        const localOverride = overrides.updatedById?.[id] || null;
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
        const apiTyvContent = getTyvContent(fromApi);
        const localTyvContent = getTyvContent(local);
        const titleTy = pickText(
          fromApi?.titleTy,
          fromApi?.title_ty,
          apiTyvContent?.title,
          local?.titleTy,
          local?.title_ty,
          localTyvContent?.title,
          localOverride?.titleTy
        );
        const descriptionTyRaw = pickText(
          fromApi?.descriptionTy,
          fromApi?.descTy,
          fromApi?.description_ty,
          apiTyvContent?.description,
          apiTyvContent?.desc,
          apiTyvContent?.content,
          local?.descriptionTy,
          local?.descTy,
          localTyvContent?.description,
          localTyvContent?.desc,
          localTyvContent?.content,
          localOverride?.descTy
        );
        const existingImages = [
          ...(Array.isArray(fromApi?.gallery) ? fromApi.gallery : []),
          ...(Array.isArray(fromApi?.images) ? fromApi.images : []),
          ...(Array.isArray(local?.images) ? local.images : []),
          ...(Array.isArray(localOverride?.images) ? localOverride.images : []),
        ];
        const toImageUrl = (image) => {
          if (!image) return "";
          if (typeof image === "string") {
            return image.startsWith("/") || /^(https?:|data:|blob:)/i.test(image) ? image : `/files/v2/${image}`;
          }
          const link = image?.link || image?.url || image?.file?.link || image?.file?.url;
          if (link) return link;
          const fileId = image?.id || image?.file?.id || image?.imageId || image?.image_id;
          return fileId ? `/files/v2/${fileId}` : "";
        };
        const cover = toImageUrl(
          localOverride?.image ||
            local?.image ||
            fromApi?.coverImage ||
            fromApi?.image ||
            fromApi?.imageId ||
            fromApi?.image_id
        );
        const gallery = [...new Set(existingImages.map(toImageUrl).filter(Boolean))];
        if (alive) {
          setExistingCover(cover);
          setExistingGallery(gallery);
        }
        form.setFieldsValue({
          title: title || "",
          date: dateSplit.date || "",
          description: dateSplit.description || "",
          url: url || "",
          isActive,
          titleTy: titleTy || "",
          descriptionTy: descriptionTyRaw || "",
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
      
      // Формируем payload с content[] для локализации — так бэкенд сохраняет переводы в БД
      const payload = {
        title: values.title,
        description: joinDateAndDescription(values.date, values.description || ""),
        url: values.url,
        isActive: values.isActive,
        content: [
          {
            locale: "ru",
            title: values.title || "",
            description: joinDateAndDescription(values.date, values.description || ""),
          },
        ],
      };
      
      // Добавляем тувинскую локаль, если есть перевод
      const titleTy = values.titleTy != null ? String(values.titleTy).trim() : "";
      const descriptionTy = values.descriptionTy != null ? String(values.descriptionTy).trim() : "";
      if (titleTy || descriptionTy) {
        payload.content.push({
          locale: "tyv",
          title: titleTy,
          description: descriptionTy,
        });
      }

      if (mode === "create") {
        const existingCount = Array.isArray(items) ? items.length : 0;
        if (existingCount >= 5) {
          message.error("Максимум 5 слайдов. Удалите существующий слайд, чтобы добавить новый.");
          return;
        }
        const created = await onCreate?.(payload);
        const createdId = created?.id;
        const cover = coverFile?.originFileObj || coverFile;
        const gallery = galleryFiles.map((file) => file.originFileObj || file);
        if (createdId && cover) await onUploadImage?.(createdId, cover);
        if (createdId && gallery.length) await onUploadImages?.(createdId, gallery);
        message.success("Слайд создан");
        navigate("/admin/slider");
        return;
      }

      const id = String(slideId || "");
      if (!id) throw new Error("Не удалось определить ID слайда");
      await onUpdate?.(id, payload);
      const cover = coverFile?.originFileObj || coverFile;
      const gallery = galleryFiles.map((file) => file.originFileObj || file);
      if (cover) await onUploadImage?.(id, cover);
      if (gallery.length) await onUploadImages?.(id, gallery);
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
        <Form layout="vertical" form={form} initialValues={{ isActive: true, titleTy: "", descriptionTy: "" }}>
          <div className="admin-split">
            <Form.Item label="Заголовок (RU)" name="title" rules={[{ required: true, message: "Укажите заголовок" }]}>
              <Input disabled={loading || saving} />
            </Form.Item>
            <Form.Item label="Дата события" name="date" rules={[{ required: true, message: "Укажите дату события" }]}>
              <Input type="date" disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item
            label="Описание (RU)"
            name="description"
            tooltip="Используйте редактор для форматирования текста"
            getValueFromEvent={(value) => value}
            getValueProps={(value) => ({ value })}
          >
            <TinyMCEEditor
              height={400}
              placeholder="Описание"
              disabled={loading || saving}
            />
          </Form.Item>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(10, 31, 68, 0.08)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Тувинский язык (TY)</div>
              <Button
                type="default"
                onClick={handleTranslateToTy}
                loading={translating}
                disabled={!canWrite || translating || loading || saving}
              >
                Получить автоматический перевод
              </Button>
            </div>
            <Form.Item label="Заголовок (TY)" name="titleTy">
              <Input placeholder="Заголовок на тувинском языке" disabled={loading || saving} />
            </Form.Item>
            <Form.Item
              label="Описание (TY)"
              name="descriptionTy"
              tooltip="Описание слайда на тувинском языке"
              getValueFromEvent={(value) => value}
              getValueProps={(value) => ({ value })}
            >
              <TinyMCEEditor
                height={300}
                placeholder="Описание на тувинском языке"
                disabled={loading || saving}
              />
            </Form.Item>
          </div>

          <div className="admin-split">
            <Form.Item label="Ссылка" name="url">
              <Input disabled={loading || saving} placeholder="/news?id=123 или https://..." />
            </Form.Item>
            <Form.Item label="Активен" name="isActive" valuePropName="checked">
              <Switch disabled={loading || saving} />
            </Form.Item>
          </div>

          <Form.Item label="Обложка слайда" tooltip="Используется в слайдере на главной странице">
            <Upload
              accept="image/*"
              maxCount={1}
              fileList={coverFile ? [coverFile] : []}
              beforeUpload={() => false}
              onChange={({ fileList }) => setCoverFile(fileList[0] || null)}
              showUploadList={true}
            >
              <Button disabled={loading || saving}>Выбрать обложку</Button>
            </Upload>
            {existingCover ? (
              <div style={{ marginTop: 12 }}>
                <img
                  src={normalizeFilesUrl(existingCover)}
                  alt="Текущая обложка"
                  style={{ width: 160, height: 90, objectFit: "cover", borderRadius: 6 }}
                />
              </div>
            ) : null}
            <div className="admin-hint">Обложка отображается в слайдере на главной странице.</div>
          </Form.Item>

          <Form.Item label="Изображения для детальной страницы" tooltip="Можно загрузить несколько изображений для карусели">
            <Upload
              accept="image/*"
              multiple
              fileList={galleryFiles}
              beforeUpload={() => false}
              onChange={({ fileList }) => setGalleryFiles(fileList)}
              showUploadList={true}
            >
              <Button disabled={loading || saving}>Выбрать изображения</Button>
            </Upload>
            {existingGallery.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {existingGallery.map((image, index) => (
                  <img
                    key={`${image}-${index}`}
                    src={normalizeFilesUrl(image)}
                    alt={`Изображение ${index + 1}`}
                    style={{ width: 96, height: 64, objectFit: "cover", borderRadius: 6 }}
                  />
                ))}
              </div>
            ) : null}
            <div className="admin-hint">
              Изображения будут показаны в карусели на детальной странице слайда.
            </div>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
