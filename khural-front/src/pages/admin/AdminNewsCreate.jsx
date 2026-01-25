import React from "react";
// TMP_MARKER
import { App, Button, Input, Form, Upload, Select, DatePicker, Switch } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useTranslation } from "../../hooks/index.js";
import { NewsApi } from "../../api/client.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";

// Функция для сжатия изображения (более агрессивное сжатие)
function compressImage(file, maxWidth = 1200, maxHeight = 800, quality = 0.7, maxSizeMB = 0.5) {
  return new Promise((resolve) => {
    // Если файл уже маленький, не сжимаем
    if (file.size < maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Вычисляем новые размеры
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // Улучшаем качество рендеринга
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Пробуем разные уровни качества, пока не достигнем нужного размера
        const tryCompress = (q) => {
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size <= maxSizeMB * 1024 * 1024) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg", // Всегда используем JPEG для лучшего сжатия
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else if (q > 0.3) {
                // Пробуем с меньшим качеством
                tryCompress(q - 0.1);
              } else {
                // Если даже с минимальным качеством не получилось, возвращаем то что есть
                const compressedFile = new File([blob || new Blob()], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            "image/jpeg", // Всегда используем JPEG для лучшего сжатия
            q
          );
        };

        tryCompress(quality);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// Функция для удаления base64 изображений из HTML (более агрессивная)
function removeBase64Images(html) {
  if (!html) return html;
  let cleaned = String(html);
  // Удаляем data:image в src атрибутах
  cleaned = cleaned.replace(/src="data:image[^"]*"/gi, 'src=""');
  // Удаляем data:image в style атрибутах (background-image)
  cleaned = cleaned.replace(/background-image:\s*url\(['"]?data:image[^'"]*['"]?\)/gi, '');
  // Удаляем встроенные base64 изображения в тегах img
  cleaned = cleaned.replace(/<img[^>]*src=["']data:image[^"']*["'][^>]*>/gi, '');
  return cleaned;
}

// Функция для генерации уникального slug из заголовка
function generateUniqueSlug(title) {
  if (!title) return null;
  const baseSlug = String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Удаляем спецсимволы
    .replace(/[\s_-]+/g, '-') // Заменяем пробелы и подчеркивания на дефисы
    .replace(/^-+|-+$/g, '') // Удаляем дефисы в начале и конце
    .substring(0, 80); // Ограничиваем длину
  
  if (!baseSlug || baseSlug === '-') {
    // Если slug пустой или только дефис, генерируем случайный
    const random = Math.random().toString(36).substring(2, 8);
    return `news-${Date.now()}-${random}`;
  }
  
  // Добавляем timestamp и случайную строку для уникальности
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${timestamp}-${random}`;
}

// Проверка, что метод существует при загрузке модуля
if (typeof NewsApi.createCategory !== 'function') {
  console.error('NewsApi.createCategory is missing! Available methods:', Object.keys(NewsApi));
}
import dayjs from "dayjs";
import { decodeHtmlEntities } from "../../utils/html.js";
import { useData } from "../../context/DataContext.jsx";

export default function AdminNewsCreate({ onCreate, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const [images, setImages] = React.useState([]);
  const [coverImage, setCoverImage] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [creatingCategory, setCreatingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const { translate, loading: translating, error: translationError, clearError } = useTranslation();
  const { news: publicNews } = useData();
  
  const handleCreateCategory = React.useCallback(async () => {
    if (!newCategoryName || !newCategoryName.trim()) {
      antdMessage.warning("Введите название категории");
      return;
    }
    const trimmed = newCategoryName.trim();
    const exists = categories.some((cat) => 
      String(cat.name || "").toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      antdMessage.warning(`Категория "${trimmed}" уже существует`);
      return;
    }
    
    setCreatingCategory(true);
    try {
      console.log("Creating news category:", trimmed);
      console.log("NewsApi object:", NewsApi);
      console.log("NewsApi.createCategory:", typeof NewsApi.createCategory);
      
      // Проверяем, что метод существует
      if (typeof NewsApi.createCategory !== 'function') {
        throw new Error('NewsApi.createCategory is not a function. Available methods: ' + Object.keys(NewsApi).join(', '));
      }
      
      const newCategory = await NewsApi.createCategory({ name: trimmed });
      console.log("Category created:", newCategory);
      if (newCategory && newCategory.id) {
        // Добавляем новую категорию в список
        setCategories((prev) => {
          const updated = [...(prev || []), newCategory];
          console.log("Updated categories list:", updated);
          return updated;
        });
        form.setFieldValue("categoryId", newCategory.id);
        setNewCategoryName("");
        antdMessage.success(`Категория "${trimmed}" создана`);
      } else {
        // Если API вернул категорию без id, попробуем перезагрузить список
        console.warn("Category created but no id returned, reloading categories...");
        const cats = await NewsApi.getAllCategories();
        if (Array.isArray(cats)) {
          setCategories(cats);
          // Находим созданную категорию по имени
          const found = cats.find(c => String(c.name || "").toLowerCase() === trimmed.toLowerCase());
          if (found && found.id) {
            form.setFieldValue("categoryId", found.id);
          }
        }
        antdMessage.success(`Категория "${trimmed}" создана`);
      }
    } catch (error) {
      console.error("Failed to create category:", error);
      antdMessage.error(`Не удалось создать категорию: ${error?.message || "Неизвестная ошибка"}`);
    } finally {
      setCreatingCategory(false);
    }
  }, [newCategoryName, categories, form, antdMessage]);

  // Загружаем категории при монтировании
  React.useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const fallbackFromNews = () => {
          const unique = new Map();
          (Array.isArray(publicNews) ? publicNews : []).forEach((n) => {
            const name = (n?.category || "").trim();
            if (name) unique.set(name, { id: String(name), name });
          });
          const arr = Array.from(unique.values());
          if (arr.length) setCategories(arr);
        };

        const cats = await NewsApi.getAllCategories();
        if (Array.isArray(cats) && cats.length) {
          setCategories(cats);
        } else {
          fallbackFromNews();
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
        // Попробуем подставить категории из публичных новостей, чтобы дать выбор
        const unique = new Map();
        (Array.isArray(publicNews) ? publicNews : []).forEach((n) => {
          const name = (n?.category || "").trim();
          if (name) unique.set(name, { id: String(name), name });
        });
        setCategories(Array.from(unique.values()));
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);
  // Очищаем ошибку при изменении
  React.useEffect(() => {
    if (translationError) {
      antdMessage.error("Ошибка при переводе: " + (translationError?.message || "Неизвестная ошибка"));
      clearError();
    }
  }, [translationError, antdMessage, clearError]);

  const handleTranslate = async (fromLang, toLang) => {
    try {
      const values = form.getFieldsValue();
      const titleField = fromLang === "tyv" ? "titleTy" : "titleRu";
      const contentField = fromLang === "tyv" ? "contentTy" : "contentRu";
      
      const titleTarget = toLang === "tyv" ? "titleTy" : "titleRu";
      const contentTarget = toLang === "tyv" ? "contentTy" : "contentRu";
      
      const title = String(values[titleField] || "");
      const content = String(values[contentField] || "");
      
      if (!title && !content) {
        antdMessage.warning("Заполните поля для перевода");
        return;
      }
      
      // Используем хук для перевода
      const translations = await Promise.all([
        title ? translate(title, fromLang, toLang) : Promise.resolve({ translated: "" }),
        content ? translate(content, fromLang, toLang) : Promise.resolve({ translated: "" }),
      ]);
      
      // Убеждаемся, что извлекаем строку, а не объект
      const translatedTitle = String(
        translations[0]?.translated || 
        (typeof translations[0] === "string" ? translations[0] : "") || 
        ""
      );
      const translatedContent = String(
        translations[1]?.translated || 
        (typeof translations[1] === "string" ? translations[1] : "") || 
        ""
      );
      
      // Устанавливаем значения в форму
      form.setFieldsValue({
        [titleTarget]: translatedTitle,
        [contentTarget]: translatedContent,
      });
      
      antdMessage.success("Перевод выполнен");
    } catch (error) {
      console.error("Translation error:", error);
      // Ошибка уже обработана в useEffect через translationError
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Получаем контент из текстовых полей (raw HTML) и удаляем base64 изображения
      const contentRu = removeBase64Images(decodeHtmlEntities(values.contentRu || ""));
      const contentTy = removeBase64Images(decodeHtmlEntities(values.contentTy || ""));
      const shortRu = removeBase64Images(decodeHtmlEntities(values.shortDescriptionRu || ""));
      const shortTy = removeBase64Images(decodeHtmlEntities(values.shortDescriptionTy || ""));
      
      // Формируем массив локализованного контента
      const contentArray = [];
      
      // Русский контент (обязательно)
      if (values.titleRu || contentRu) {
        contentArray.push({
          locale: "ru",
          title: values.titleRu || "",
          content: contentRu || "",
          shortDescription: shortRu || "",
        });
      }
      
      // Тувинский контент (опционально)
      if (values.titleTy || contentTy) {
        contentArray.push({
          locale: "tyv",
          title: values.titleTy || "",
          content: contentTy || "",
          shortDescription: shortTy || "",
        });
      }
      
      // Сжимаем изображения перед отправкой (более агрессивное сжатие)
      antdMessage.loading({ content: "Сжатие изображений...", key: "compressing", duration: 0 });
      let compressedCover = null;
      if (coverImage) {
        compressedCover = await compressImage(coverImage, 1200, 800, 0.7, 0.3); // Макс 0.3MB для обложки
        console.log(`[AdminNewsCreate] Обложка: ${(coverImage.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedCover.size / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const compressedImages = [];
      if (images && images.length > 0) {
        // Ограничиваем количество изображений до 5
        const imagesToProcess = images.slice(0, 5);
        if (images.length > 5) {
          antdMessage.warning(`Будет загружено только первые 5 изображений из ${images.length}`);
        }
        
        for (const file of imagesToProcess) {
          const compressed = await compressImage(file, 1000, 700, 0.6, 0.2); // Макс 0.2MB для каждого изображения
          compressedImages.push(compressed);
          console.log(`[AdminNewsCreate] Изображение ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
        }
      }
      
      antdMessage.destroy("compressing");
      
      // Формируем FormData для multipart/form-data
      const formData = new FormData();
      
      // Добавляем JSON поля
      formData.append("categoryId", String(values.categoryId));
      if (values.publishedAt) {
        const timestamp = values.publishedAt && typeof values.publishedAt.valueOf === 'function' 
          ? values.publishedAt.valueOf() 
          : new Date(values.publishedAt).getTime();
        formData.append("publishedAt", String(timestamp));
      }
      formData.append("isPublished", String(values.isPublished ?? false));
      formData.append("content", JSON.stringify(contentArray));
      
      // Генерируем уникальный slug на основе заголовка, чтобы избежать конфликтов
      const titleRu = String(values.titleRu || "").trim();
      if (titleRu) {
        const uniqueSlug = generateUniqueSlug(titleRu);
        if (uniqueSlug) {
          formData.append("slug", uniqueSlug);
          console.log(`[AdminNewsCreate] Сгенерирован slug: ${uniqueSlug}`);
        }
      }
      
      // Добавляем сжатые файлы
      if (compressedCover) {
        formData.append("cover", compressedCover);
      }
      if (compressedImages.length > 0) {
        compressedImages.forEach((file) => {
          formData.append("gallery", file);
        });
      }
      
      // Проверяем общий размер данных (примерно)
      let totalSize = 0;
      const contentSize = new Blob([JSON.stringify(contentArray)]).size;
      totalSize += contentSize;
      if (compressedCover) totalSize += compressedCover.size;
      compressedImages.forEach(img => totalSize += img.size);
      
      const totalSizeMB = totalSize / 1024 / 1024;
      console.log(`[AdminNewsCreate] Общий размер данных: ${totalSizeMB.toFixed(2)}MB`);
      
      // Предупреждаем, если размер больше 2MB
      if (totalSizeMB > 2) {
        antdMessage.warning(`Размер данных большой (${totalSizeMB.toFixed(2)}MB). Если возникнет ошибка, попробуйте уменьшить количество или размер изображений.`);
      }
      
      // Блокируем отправку, если размер больше 5MB
      if (totalSizeMB > 5) {
        antdMessage.error(`Размер данных слишком большой (${totalSizeMB.toFixed(2)}MB). Максимальный размер: 5MB. Пожалуйста, уменьшите количество или размер изображений.`);
        return;
      }
      
      await onCreate(formData);
      antdMessage.success("Новость успешно создана");
      // Перенаправляем на публичную страницу новостей
      setTimeout(() => {
        window.location.href = "/news";
      }, 1000);
    } catch (error) {
      if (error?.errorFields) return;
      
      // Обработка ошибок авторизации
      if (error?.status === 401) {
        antdMessage.error("Сессия истекла. Пожалуйста, войдите заново.");
        setTimeout(() => {
          navigate("/login?next=" + encodeURIComponent("/admin/news/create"));
        }, 1500);
        return;
      }
      
      // Обработка ошибки 409 (Conflict - slug уже существует)
      if (error?.status === 409 || error?.message?.includes("409") || error?.message?.includes("already exists") || error?.message?.includes("slug")) {
        antdMessage.error({
          content: "Новость с таким URL-адресом уже существует. Попробуйте изменить заголовок или подождите несколько секунд и попробуйте снова.",
          duration: 8,
        });
        console.error("Slug conflict:", error);
        return;
      }
      
      // Обработка ошибки 413 (Request Entity Too Large)
      if (error?.status === 413 || error?.message?.includes("413") || error?.message?.includes("Entity Too Large")) {
        antdMessage.error({
          content: "Размер данных слишком большой (413). Пожалуйста, уменьшите количество или размер изображений. Максимальный размер: 2-3MB.",
          duration: 8,
        });
        return;
      }
      
      // Обработка CORS ошибки
      if (error?.message?.includes("CORS") || error?.message?.includes("Access-Control-Allow-Origin")) {
        antdMessage.error({
          content: "Ошибка CORS. Проверьте настройки сервера или попробуйте позже.",
          duration: 5,
        });
        console.error("CORS error:", error);
        return;
      }
      
      // Обработка сетевых ошибок
      if (error?.message?.includes("Failed to fetch") || error?.status === 0) {
        antdMessage.error({
          content: "Ошибка сети. Проверьте подключение к интернету или попробуйте позже.",
          duration: 5,
        });
        console.error("Network error:", error);
        return;
      }
      
      const errorMsg = error?.message || error?.data?.message || "Не удалось создать новость";
      console.error("Error creating news:", error);
      antdMessage.error(errorMsg);
    }
  };

  return (
    <div className="admin-news-editor">
      <div className="admin-news-editor__hero">
        <div className="admin-news-editor__hero-row">
          <div className="admin-news-editor__hero-left">
            <div className="admin-news-editor__kicker">Новости</div>
            <div className="admin-news-editor__title">Создание новости</div>
            <div className="admin-news-editor__subtitle">Заполните поля и нажмите «Сохранить»</div>
          </div>
          <div className="admin-news-editor__hero-actions">
            <Button onClick={() => navigate("/admin/news")}>Отмена</Button>
            <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
              Сохранить
            </Button>
          </div>
        </div>
      </div>

      <Form layout="vertical" form={form} initialValues={{ isPublished: true }}>
        {/* 1 ряд: Заголовки */}
        <div className="admin-news-editor__lang-grid">
          <div className="admin-card">
            <div className="admin-news-editor__section-title">Заголовок (TY)</div>
            <Form.Item
              name="titleTy"
              rules={[{ required: false, message: "Укажите заголовок" }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Заголовок на тувинском языке" />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-news-editor__section-title">Заголовок (RU) *</div>
            <Form.Item
              name="titleRu"
              rules={[{ required: true, message: "Укажите заголовок" }]}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Заголовок на русском языке" />
            </Form.Item>
          </div>
        </div>

        {/* 2 ряд: Краткие описания */}
        <div className="admin-news-editor__lang-grid">
          <div className="admin-card">
            <div className="admin-news-editor__section-title">Краткое описание (TY)</div>
            <Form.Item
              name="shortDescriptionTy"
              tooltip="Краткое описание новости на тувинском языке"
              getValueFromEvent={(value) => value}
              style={{ marginBottom: 0 }}
            >
              <TinyMCEEditor
                height={300}
                placeholder="Краткое описание"
                disabled={busy || !canWrite}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-news-editor__section-title">Краткое описание (RU)</div>
            <Form.Item
              name="shortDescriptionRu"
              tooltip="Краткое описание новости на русском языке"
              getValueFromEvent={(value) => value}
              style={{ marginBottom: 0 }}
            >
              <TinyMCEEditor
                height={300}
                placeholder="Краткое описание"
                disabled={busy || !canWrite}
              />
            </Form.Item>
          </div>
        </div>

        {/* 3 ряд: Контент */}
        <div className="admin-news-editor__lang-grid">
          <div className="admin-card">
            <div className="admin-news-editor__lang-head">
              <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                Контент (TY)
              </div>
              <Button
                type="default"
                onClick={() => handleTranslate("ru", "tyv")}
                loading={translating}
                disabled={!canWrite || translating}
              >
                Получить автоматический перевод
              </Button>
            </div>
            <Form.Item
              name="contentTy"
              rules={[{ required: false, message: "Укажите контент" }]}
              getValueFromEvent={(value) => value}
              style={{ marginBottom: 0 }}
            >
              <TinyMCEEditor
                height={400}
                placeholder="Контент на тувинском языке"
                disabled={busy || !canWrite}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-news-editor__lang-head">
              <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                Контент (RU) *
              </div>
              <Button
                type="default"
                onClick={() => handleTranslate("tyv", "ru")}
                loading={translating}
                disabled={!canWrite || translating}
              >
                Получить автоматический перевод
              </Button>
            </div>
            <Form.Item
              name="contentRu"
              rules={[{ required: true, message: "Укажите контент" }]}
              getValueFromEvent={(value) => value}
              style={{ marginBottom: 0 }}
            >
              <TinyMCEEditor
                height={400}
                placeholder="Контент на русском языке"
                disabled={busy || !canWrite}
              />
            </Form.Item>
          </div>
        </div>

        {/* Остальное: Основное и Публикация */}
        <div className="admin-news-editor__grid">
          <div className="admin-card">
            <div className="admin-news-editor__section-title">Основное</div>
            <Form.Item
              label="Категория"
              name="categoryId"
              rules={[{ required: true, message: "Выберите категорию" }]}
            >
              <Select
                placeholder="Выберите категорию"
                loading={loadingCategories || creatingCategory}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.label || "").toLowerCase().includes(String(input || "").toLowerCase())
                }
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: 8, borderTop: "1px solid #f0f0f0" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Input
                          placeholder="Новая категория"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onPressEnter={handleCreateCategory}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type="primary"
                          size="small"
                          onClick={handleCreateCategory}
                          loading={creatingCategory}
                          disabled={!canWrite || creatingCategory}
                        >
                          Создать
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                options={categories.map((cat) => ({
                  value: cat.id,
                  label: cat.name,
                }))}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-news-editor__section-title">Публикация</div>
            <Form.Item label="Дата публикации" name="publishedAt">
              <DatePicker
                showTime
                format="DD.MM.YYYY HH:mm"
                style={{ width: "100%" }}
                placeholder="Выберите дату публикации"
              />
            </Form.Item>
            <Form.Item label="Опубликовано" name="isPublished" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
        </div>
      </Form>

      {/* Медиа файлы */}
      <div className="admin-news-editor__media-grid">
        <div className="admin-card">
          <div className="admin-news-editor__section-title">Обложка</div>
          <Upload
            accept={undefined}
            maxCount={1}
            listType="picture-card"
            beforeUpload={(file) => {
              setCoverImage(file);
              return false;
            }}
            onRemove={() => {
              setCoverImage(null);
            }}
            fileList={coverImage ? [coverImage] : []}
            itemRender={(originNode, file) => {
              const url = file.url || (file.thumbUrl) || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);
              return url ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              ) : originNode;
            }}
          >
            {!coverImage && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
        </div>
        <div className="admin-card">
          <div className="admin-news-editor__section-title">Галерея</div>
          <Upload
            accept={undefined}
            multiple
            listType="picture-card"
            beforeUpload={(file) => {
              setImages((prev) => [...prev, file]);
              return false;
            }}
            onRemove={(file) => {
              setImages((prev) => {
                if (file.uid) {
                  return prev.filter((f) => f.uid !== file.uid);
                }
                return prev.filter((f) => f.name !== file.name);
              });
            }}
            fileList={images}
            itemRender={(originNode, file) => {
              const url = file.url || (file.thumbUrl) || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);
              return url ? (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              ) : originNode;
            }}
          >
            {images.length < 10 && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
        </div>
      </div>

      {!canWrite ? (
        <div className="admin-card admin-card--warning" style={{ marginTop: 16 }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </div>
  );
}

