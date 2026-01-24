import React from "react";
import { App, Button, Input, Form, Upload, Select, DatePicker, Switch } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useTranslation } from "../../hooks/index.js";
import { NewsApi } from "../../api/client.js";
import dayjs from "dayjs";
import { useData } from "../../context/DataContext.jsx";
import { decodeHtmlEntities, stripHtmlTags } from "../../utils/html.js";
import TinyMCEEditor from "../../components/TinyMCEEditor.jsx";

export default function AdminNewsEdit({ newsId, onUpdate, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const [images, setImages] = React.useState([]);
  const [coverImage, setCoverImage] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [creatingCategory, setCreatingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [loadingNews, setLoadingNews] = React.useState(true);
  const [newsData, setNewsData] = React.useState(null);
  const [saving, setSaving] = React.useState(false);
  const { translate, loading: translating, error: translationError, clearError } = useTranslation();
  const { reload: reloadPublicData, news: publicNews } = useData();
  
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

  // Загружаем данные новости для редактирования
  React.useEffect(() => {
    const loadNews = async () => {
      if (!newsId) return;
      setLoadingNews(true);
      try {
        const news = await NewsApi.getById(newsId);
        setNewsData(news);

        // Извлекаем контент по языкам
        const contentArray = Array.isArray(news.content) ? news.content : [];
        const ruContent = contentArray.find((c) => c.locale === "ru") || {};
        const tyvContent = contentArray.find((c) => c.locale === "tyv") || {};

        // Заполняем форму
        // Для краткого описания убираем HTML теги (это должно быть простым текстом)
        // Для подробного описания (content) оставляем HTML, так как используется TinyMCE
        // Обрабатываем publishedAt: может быть timestamp (число) или ISO строка
        let publishedAtValue = null;
        if (news.publishedAt) {
          if (typeof news.publishedAt === "number") {
            // Timestamp в миллисекундах
            publishedAtValue = dayjs(news.publishedAt);
          } else if (typeof news.publishedAt === "string") {
            // ISO строка или другая строка
            publishedAtValue = dayjs(news.publishedAt);
          } else {
            publishedAtValue = dayjs(news.publishedAt);
          }
          // Проверяем, что dayjs объект валидный
          if (!publishedAtValue.isValid()) {
            publishedAtValue = null;
          }
        }
        
        form.setFieldsValue({
          categoryId: news.category?.id,
          slug: news.slug,
          publishedAt: publishedAtValue,
          isPublished: news.isPublished ?? false,
          shortDescriptionRu: stripHtmlTags(ruContent.shortDescription || ""),
          titleRu: ruContent.title || "",
          contentRu: decodeHtmlEntities(ruContent.content || ""),
          shortDescriptionTy: stripHtmlTags(tyvContent.shortDescription || ""),
          titleTy: tyvContent.title || "",
          contentTy: decodeHtmlEntities(tyvContent.content || ""),
        });

        // Загружаем информацию о медиа
        if (news.coverImage) {
          // Если есть обложка, создаем объект для отображения
          setCoverImage({
            uid: news.coverImage.id,
            fileId: news.coverImage.id,
            name: news.coverImage.name || "cover",
            status: "done",
            url: news.coverImage.link,
          });
        }
        if (news.gallery && Array.isArray(news.gallery)) {
          setImages(
            news.gallery.map((file, index) => ({
              uid: file.id || `gallery-${index}`,
              fileId: file.id,
              name: file.name || `gallery-${index}.jpg`,
              status: "done",
              url: file.link,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load news:", error);
        antdMessage.error("Не удалось загрузить новость");
        navigate("/admin/news");
      } finally {
        setLoadingNews(false);
      }
    };
    loadNews();
  }, [newsId, form, navigate, antdMessage]);

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
    if (!canWrite) {
      antdMessage.warning("Нет прав на запись");
      return;
    }
    
    if (saving) {
      console.warn("Save already in progress, ignoring duplicate click");
      return;
    }
    
    setSaving(true);
    let payload = null; // Для использования в catch блоке
    try {
      const values = await form.validateFields();

      // Получаем контент: TinyMCE возвращает HTML напрямую, краткое описание - обычный текст
      const contentRu = String(values.contentRu || "").trim();
      const contentTy = String(values.contentTy || "").trim();
      // Убираем HTML теги из краткого описания (оно должно быть простым текстом)
      const shortRu = stripHtmlTags(String(values.shortDescriptionRu || "").trim());
      const shortTy = stripHtmlTags(String(values.shortDescriptionTy || "").trim());
      const titleRu = String(values.titleRu || "").trim();
      const titleTy = String(values.titleTy || "").trim();

      // Формируем массив локализованного контента
      const contentArray = [];

      // Русский контент (обязательно)
      if (titleRu || contentRu) {
        const ruItem = {
          locale: "ru",
          title: titleRu || "",
        };
        if (contentRu) ruItem.content = contentRu;
        if (shortRu) ruItem.shortDescription = shortRu;
        contentArray.push(ruItem);
      }

      // Тувинский контент (опционально)
      if (titleTy || contentTy) {
        const tyvItem = {
          locale: "tyv",
          title: titleTy || "",
        };
        if (contentTy) tyvItem.content = contentTy;
        if (shortTy) tyvItem.shortDescription = shortTy;
        contentArray.push(tyvItem);
      }

      // Проверяем, что есть хотя бы русский контент
      if (contentArray.length === 0) {
        antdMessage.error("Заполните хотя бы русский заголовок или контент");
        setSaving(false);
        return;
      }
      
      // Проверяем обязательные поля для русского контента
      const ruContent = contentArray.find(c => c.locale === "ru");
      if (!ruContent || (!ruContent.title && !ruContent.content)) {
        antdMessage.error("Заполните заголовок или контент для русского языка");
        setSaving(false);
        return;
      }

      // JSON-патч для текстовых данных
      // Бэкенд ожидает timestamp в миллисекундах (число), а не ISO строку
      let publishedAtValue = undefined;
      if (values.publishedAt) {
        let timestamp;
        if (values.publishedAt && typeof values.publishedAt.valueOf === "function") {
          // dayjs объект - используем valueOf() для получения timestamp в миллисекундах
          timestamp = values.publishedAt.valueOf();
        } else if (values.publishedAt instanceof Date) {
          timestamp = values.publishedAt.getTime();
        } else if (typeof values.publishedAt === "number") {
          // Уже timestamp
          timestamp = values.publishedAt;
        } else {
          // Строка - конвертируем в Date и получаем timestamp
          timestamp = new Date(values.publishedAt).getTime();
        }
        // Проверяем, что timestamp валидный
        if (!isNaN(timestamp) && timestamp > 0) {
          publishedAtValue = timestamp;
        }
      }

      payload = {
        categoryId: values.categoryId,
        slug: values.slug || undefined,
        ...(publishedAtValue !== undefined ? { publishedAt: publishedAtValue } : { publishedAt: null }),
        isPublished: values.isPublished ?? false,
        content: contentArray,
      };

      console.log("Saving news with payload:", JSON.stringify(payload, null, 2));
      console.log("News ID:", newsId);
      console.log("API endpoint:", `/news/${newsId}`);
      
      const result = await NewsApi.patch(newsId, payload);
      console.log("News update response:", result);
      
      // Проверяем, что ответ успешный
      if (!result) {
        throw new Error("API вернул пустой ответ");
      }

      // Обложка (только новые файлы)
      if (coverImage?.originFileObj) {
        console.log("Uploading cover image...");
        await NewsApi.uploadCover(newsId, coverImage.originFileObj);
        console.log("Cover image uploaded");
      }

      // Новые картинки галереи (добавляем)
      const newGalleryFiles = (images || [])
        .filter((f) => f.originFileObj)
        .map((f) => f.originFileObj);
      if (newGalleryFiles.length) {
        console.log(`Uploading ${newGalleryFiles.length} gallery images...`);
        await NewsApi.uploadGallery(newsId, newGalleryFiles);
        console.log("Gallery images uploaded");
      }

      // Проверяем, что данные действительно сохранились и обновляем форму
      try {
        console.log("Verifying saved data...");
        const updatedNews = await NewsApi.getById(newsId);
        console.log("Verified saved news:", updatedNews);
        
        // Обновляем форму с сохраненными данными
        const contentArray = Array.isArray(updatedNews.content) ? updatedNews.content : [];
        const ruContent = contentArray.find((c) => c.locale === "ru") || {};
        const tyvContent = contentArray.find((c) => c.locale === "tyv") || {};
        
        // Обрабатываем publishedAt из ответа
        let publishedAtValue = null;
        if (updatedNews.publishedAt) {
          if (typeof updatedNews.publishedAt === "number") {
            publishedAtValue = dayjs(updatedNews.publishedAt);
          } else {
            publishedAtValue = dayjs(updatedNews.publishedAt);
          }
          if (!publishedAtValue.isValid()) {
            publishedAtValue = null;
          }
        }
        
        // Обновляем форму с актуальными данными
        form.setFieldsValue({
          categoryId: updatedNews.category?.id,
          slug: updatedNews.slug,
          publishedAt: publishedAtValue,
          isPublished: updatedNews.isPublished ?? false,
          shortDescriptionRu: stripHtmlTags(ruContent.shortDescription || ""),
          titleRu: ruContent.title || "",
          contentRu: decodeHtmlEntities(ruContent.content || ""),
          shortDescriptionTy: stripHtmlTags(tyvContent.shortDescription || ""),
          titleTy: tyvContent.title || "",
          contentTy: decodeHtmlEntities(tyvContent.content || ""),
        });
        
        // Обновляем локальное состояние
        setNewsData(updatedNews);
        
        const savedRu = ruContent;
        if (savedRu) {
          console.log("Saved RU content:", {
            title: savedRu.title,
            contentLength: savedRu.content?.length || 0,
            shortDescription: savedRu.shortDescription,
          });
        } else {
          console.warn("No Russian content found in saved news!");
        }
      } catch (verifyError) {
        console.warn("Could not verify saved news:", verifyError);
      }

      antdMessage.success("Новость обновлена");
      
      // Принудительно перезагружаем данные несколько раз для надежности
      if (reloadPublicData) {
        reloadPublicData();
        // Даем время на обновление данных
        await new Promise(resolve => setTimeout(resolve, 500));
        // Перезагружаем еще раз для надежности
        reloadPublicData();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      navigate("/admin/news");
    } catch (error) {
      console.error("Error saving news:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        stack: error?.stack,
      });
      
      if (error?.errorFields) {
        antdMessage.warning("Проверьте заполнение полей");
        setSaving(false);
        return;
      }
      
      // Более детальные сообщения об ошибках
      let errorMessage = "Не удалось обновить новость";
      if (error?.status === 401) {
        errorMessage = "Ошибка авторизации. Проверьте, что вы вошли в систему.";
      } else if (error?.status === 403) {
        errorMessage = "Нет прав на редактирование новостей";
      } else if (error?.status === 404) {
        errorMessage = "Новость не найдена";
      } else if (error?.status === 400) {
        // Детальная обработка ошибок валидации
        console.error("400 Bad Request - детали ошибки:", {
          message: error?.message,
          data: error?.data,
          payload: payload,
        });
        
        if (error?.data?.message) {
          errorMessage = `Ошибка валидации: ${error.data.message}`;
        } else if (Array.isArray(error?.data?.errors)) {
          const errorsList = error.data.errors.map(e => e.message || e).join(", ");
          errorMessage = `Ошибки валидации: ${errorsList}`;
        } else if (error?.message) {
          errorMessage = `Ошибка валидации: ${error.message}`;
        } else {
          errorMessage = `Ошибка валидации (400). Проверьте, что все обязательные поля заполнены правильно.`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      antdMessage.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loadingNews) {
    return (
      <div className="admin-news-editor">
        <div className="admin-card" style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 900 }}>Загрузка данных новости…</div>
          <div className="admin-hint">Подождите, загружаем контент, категории и медиа.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-news-editor">
      <div className="admin-news-editor__hero">
        <div className="admin-news-editor__hero-row">
          <div className="admin-news-editor__hero-left">
            <div className="admin-news-editor__kicker">Новости</div>
            <div className="admin-news-editor__title">Редактирование новости</div>
            {newsData?.slug ? <div className="admin-news-editor__subtitle">{String(newsData.slug)}</div> : null}
          </div>
          <div className="admin-news-editor__hero-actions">
            <Button onClick={() => navigate("/admin/news")}>Отмена</Button>
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={saving || busy} 
              disabled={!canWrite || saving}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </div>

      <Form layout="vertical" form={form}>
        {/* Общие поля */}
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
            <Form.Item
              label="Slug (URL-адрес)"
              name="slug"
              tooltip="URL-совместимый адрес. Если не указан, будет сгенерирован автоматически"
            >
              <Input placeholder="sessiya-iyul-2025" />
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
                allowClear
              />
            </Form.Item>
            <Form.Item label="Опубликовано" name="isPublished" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
        </div>

        {/* Языковые секции */}
        <div className="admin-news-editor__lang-grid">
          <div className="admin-card">
            <div className="admin-news-editor__lang-head">
              <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                Тувинский язык
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
              label="Заголовок (TY)"
              name="titleTy"
              rules={[{ required: false, message: "Укажите заголовок" }]}
            >
              <Input placeholder="Заголовок на тувинском языке" />
            </Form.Item>
            <Form.Item
              label="Краткое описание (TY)"
              name="shortDescriptionTy"
              tooltip="Краткое описание новости на тувинском языке"
            >
              <Input.TextArea
                placeholder="Краткое описание новости"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>
            <Form.Item
              label="Подробное описание (TY)"
              name="contentTy"
              rules={[{ required: false, message: "Укажите контент" }]}
            >
              <TinyMCEEditor
                placeholder="Контент на тувинском языке"
                height={400}
              />
            </Form.Item>
          </div>

          <div className="admin-card">
            <div className="admin-news-editor__lang-head">
              <div className="admin-news-editor__section-title" style={{ marginBottom: 0 }}>
                Русский язык
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
              label="Заголовок (RU) *"
              name="titleRu"
              rules={[{ required: true, message: "Укажите заголовок" }]}
            >
              <Input placeholder="Заголовок на русском языке" />
            </Form.Item>

            <Form.Item
              label="Краткое описание (RU)"
              name="shortDescriptionRu"
              tooltip="Краткое описание новости на русском языке"
            >
              <Input.TextArea
                placeholder="Краткое описание новости"
                autoSize={{ minRows: 2, maxRows: 4 }}
              />
            </Form.Item>

            <Form.Item
              label="Подробное описание (RU) *"
              name="contentRu"
              rules={[{ required: true, message: "Укажите контент" }]}
            >
              <TinyMCEEditor
                placeholder="Контент на русском языке"
                height={400}
              />
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
              setCoverImage({
                ...file,
                uid: file.uid,
                originFileObj: file,
              });
              return false;
            }}
            onRemove={async (file) => {
              if (!canWrite) return false;
              // Новая (ещё не отправленная) — просто убираем из стейта
              if (file?.originFileObj) {
                setCoverImage(null);
                return true;
              }
              const fileId = file?.fileId || file?.uid;
              if (!fileId) {
                setCoverImage(null);
                return true;
              }
              try {
                await NewsApi.deleteCover(newsId);
                antdMessage.success("Обложка удалена");
                reloadPublicData?.();
                setCoverImage(null);
                return true;
              } catch (error) {
                antdMessage.error(error?.message || "Не удалось удалить обложку");
                return false;
              }
            }}
            fileList={coverImage ? [coverImage] : []}
            itemRender={(originNode, file) => {
              const url = file.url || file.thumbUrl || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);
              return url ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              ) : originNode;
            }}
          >
            {!coverImage && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
          <div style={{ marginTop: 8 }}>
            <Button
              danger
              size="small"
              disabled={!coverImage || !canWrite}
              onClick={async () => {
                if (!coverImage) return;
                // Новая (ещё не отправленная) — просто убираем из стейта
                if (coverImage?.originFileObj) {
                  setCoverImage(null);
                  return;
                }
                const fileId = coverImage?.fileId || coverImage?.uid;
                if (!fileId) {
                  setCoverImage(null);
                  return;
                }
                try {
                  await NewsApi.deleteCover(newsId);
                  antdMessage.success("Обложка удалена");
                  reloadPublicData?.();
                  setCoverImage(null);
                } catch (error) {
                  antdMessage.error(error?.message || "Не удалось удалить обложку");
                }
              }}
            >
              Удалить обложку
            </Button>
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-news-editor__section-title">Галерея</div>
          <Upload
            accept={undefined}
            multiple
            listType="picture-card"
            beforeUpload={(file) => {
              setImages((prev) => [...prev, {
                ...file,
                uid: file.uid,
                originFileObj: file,
              }]);
              return false;
            }}
            onRemove={async (file) => {
              if (!canWrite) return false;
              // Новые файлы — просто убираем локально
              if (file?.originFileObj) {
                setImages((prev) => prev.filter((f) => f.uid !== file.uid));
                return true;
              }
              const fileId = file?.fileId || file?.uid;
              if (!fileId) {
                setImages((prev) => prev.filter((f) => f.uid !== file.uid));
                return true;
              }
              try {
                await NewsApi.deleteGalleryImage(newsId, fileId);
                setImages((prev) => prev.filter((f) => f.uid !== file.uid));
                antdMessage.success("Изображение удалено");
                reloadPublicData?.();
                return true;
              } catch (error) {
                antdMessage.error(error?.message || "Не удалось удалить изображение");
                return false;
              }
            }}
            fileList={images}
            itemRender={(originNode, file) => {
              const url = file.url || file.thumbUrl || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);
              return url ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img
                    src={url}
                    alt={file.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              ) : originNode;
            }}
          >
            {images.length < 10 && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button
              danger
              size="small"
              disabled={!images.length || !canWrite}
              onClick={async () => {
                // Удаляем все старые изображения (с id) на сервере и локально
                const serverIds = images
                  .map((f) => f.fileId || f.uid)
                  .filter((id) => id && !images.find((x) => x.uid === id && x.originFileObj));
                try {
                  await Promise.all(
                    serverIds.map((id) =>
                      NewsApi.deleteGalleryImage(newsId, id).catch(() => null)
                    )
                  );
                } catch {
                  // игнорируем частичные ошибки, очищаем локально
                }
                setImages([]);
                reloadPublicData?.();
                antdMessage.success("Галерея очищена");
              }}
            >
              Удалить все
            </Button>
          </div>
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



