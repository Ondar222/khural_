import React from "react";
import { App, Button, Input, Form, Upload, Space, Select, DatePicker, Switch } from "antd";
import { useHashRoute } from "../../Router.jsx";
import { useTranslation } from "../../hooks/index.js";
import { Editor } from '@tinymce/tinymce-react';
import { NewsApi } from "../../api/client.js";
import dayjs from "dayjs";

export default function AdminNewsEdit({ newsId, onUpdate, busy, canWrite }) {
  const { navigate } = useHashRoute();
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const [images, setImages] = React.useState([]);
  const [coverImage, setCoverImage] = React.useState(null);
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(false);
  const [loadingNews, setLoadingNews] = React.useState(true);
  const [newsData, setNewsData] = React.useState(null);
  const { translate, loading: translating, error: translationError, clearError } = useTranslation();
  const tyvEditorRef = React.useRef(null);
  const ruEditorRef = React.useRef(null);

  // Загружаем категории при монтировании
  React.useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const cats = await NewsApi.getAllCategories();
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        console.error("Failed to load categories:", error);
        setCategories([]);
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
        form.setFieldsValue({
          categoryId: news.category?.id,
          slug: news.slug,
          publishedAt: news.publishedAt ? dayjs(news.publishedAt) : null,
          isPublished: news.isPublished ?? false,
          shortDescriptionRu: ruContent.shortDescription || "",
          titleRu: ruContent.title || "",
          contentRu: ruContent.content || "",
          shortDescriptionTy: tyvContent.shortDescription || "",
          titleTy: tyvContent.title || "",
          contentTy: tyvContent.content || "",
        });

        // Устанавливаем контент в редакторы
        setTimeout(() => {
          if (ruEditorRef.current && ruContent.content) {
            ruEditorRef.current.setContent(ruContent.content);
          }
          if (tyvEditorRef.current && tyvContent.content) {
            tyvEditorRef.current.setContent(tyvContent.content);
          }
        }, 100);

        // Загружаем информацию о медиа
        if (news.coverImage) {
          // Если есть обложка, создаем объект для отображения
          setCoverImage({
            uid: news.coverImage.id,
            name: 'cover.jpg',
            status: 'done',
            url: news.coverImage.link,
          });
        }
        if (news.gallery && Array.isArray(news.gallery)) {
          setImages(news.gallery.map((file, index) => ({
            uid: file.id || `gallery-${index}`,
            name: `gallery-${index}.jpg`,
            status: 'done',
            url: file.link,
          })));
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
      // Получаем содержимое напрямую из редактора, если он доступен
      let content = "";
      if (contentField === "contentTy" && tyvEditorRef.current) {
        content = String(tyvEditorRef.current.getContent() || "");
      } else if (contentField === "contentRu" && ruEditorRef.current) {
        content = String(ruEditorRef.current.getContent() || "");
      } else {
        // Fallback на значение из формы
        content = String(values[contentField] || "");
      }

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

      // Устанавливаем значения напрямую в редакторы через ref
      // Важно: используем setTimeout для гарантии, что редактор готов
      setTimeout(() => {
        if (contentTarget === "contentTy" && tyvEditorRef.current) {
          tyvEditorRef.current.setContent(translatedContent);
        } else if (contentTarget === "contentRu" && ruEditorRef.current) {
          ruEditorRef.current.setContent(translatedContent);
        }
      }, 100);

      antdMessage.success("Перевод выполнен");
    } catch (error) {
      console.error("Translation error:", error);
      // Ошибка уже обработана в useEffect через translationError
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Получаем контент из редакторов
      const contentRu = ruEditorRef.current ? ruEditorRef.current.getContent() : (values.contentRu || "");
      const contentTy = tyvEditorRef.current ? tyvEditorRef.current.getContent() : (values.contentTy || "");

      // Формируем массив локализованного контента
      const contentArray = [];

      // Русский контент (обязательно)
      if (values.titleRu || contentRu) {
        contentArray.push({
          locale: "ru",
          title: values.titleRu || "",
          content: contentRu || "",
          shortDescription: values.shortDescriptionRu || "",
        });
      }

      // Тувинский контент (опционально)
      if (values.titleTy || contentTy) {
        contentArray.push({
          locale: "tyv",
          title: values.titleTy || "",
          content: contentTy || "",
          shortDescription: values.shortDescriptionTy || "",
        });
      }

      // Формируем FormData для multipart/form-data
      const formData = new FormData();

      // Добавляем JSON поля
      formData.append("categoryId", String(values.categoryId));
      if (values.slug) {
        formData.append("slug", values.slug);
      }
      if (values.publishedAt) {
        const timestamp = values.publishedAt && typeof values.publishedAt.valueOf === 'function'
          ? values.publishedAt.valueOf()
          : new Date(values.publishedAt).getTime();
        formData.append("publishedAt", String(timestamp));
      }
      formData.append("isPublished", String(values.isPublished ?? false));
      formData.append("content", JSON.stringify(contentArray));

      // Добавляем файлы (только новые, не из URL)
      if (coverImage && coverImage.originFileObj) {
        formData.append("cover", coverImage.originFileObj);
      }
      if (images && images.length > 0) {
        images.forEach((file) => {
          if (file.originFileObj) {
            formData.append("gallery", file.originFileObj);
          }
        });
      }

      await onUpdate(newsId, formData);
      navigate("/admin/news");
    } catch (error) {
      if (error?.errorFields) return;
      antdMessage.error(error?.message || "Не удалось обновить новость");
    }
  };

  if (loadingNews) {
    return (
      <div style={{ width: "100%", padding: "24px", textAlign: "center" }}>
        <p>Загрузка данных новости...</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", padding: "24px" }}>
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Редактирование новости</h1>
        <Space>
          <Button onClick={() => navigate("/admin/news")}>Отмена</Button>
          <Button type="primary" onClick={handleSubmit} loading={busy} disabled={!canWrite}>
            Сохранить
          </Button>
        </Space>
      </div>

      <Form layout="vertical" form={form}>
        {/* Общие поля */}
        <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "2fr 2fr", gap: 16 }}>
          <Form.Item
            label="Категория"
            name="categoryId"
            rules={[{ required: true, message: "Выберите категорию" }]}
          >
            <Select
              placeholder="Выберите категорию"
              loading={loadingCategories}
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

        <div style={{ marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Form.Item
            label="Дата публикации"
            name="publishedAt"
          >
            <DatePicker
              showTime
              format="DD.MM.YYYY HH:mm"
              style={{ width: "100%" }}
              placeholder="Выберите дату публикации"
            />
          </Form.Item>
          <Form.Item
            label="Опубликовано"
            name="isPublished"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
        </div>

        {/* Языковые секции */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: 24,
            width: "100%",
          }}
        >
          {/* Тувинская часть */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Тувинский язык</h2>
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
              label="Контент (TY)"
              name="contentTy"
              rules={[{ required: false, message: "Укажите контент" }]}
            >
              <Editor
                apiKey={"qu8gahwqf4sz5j8567k7fmk76nqedf655jhu2c0d9bhvc0as"}
                onInit={(evt, editor) => {
                  tyvEditorRef.current = editor;
                }}
                initialValue=""
                onEditorChange={(content) => {
                  if (typeof content === "string") {
                    form.setFieldsValue({
                      contentTy: content,
                    });
                  }
                }}
                plugins={["lists", "link", "image", "media"]}
                toolbar="lists link image media"
              />
            </Form.Item>
          </div>

          {/* Русская часть */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Русский язык</h2>
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
              label="Контент (RU) *"
              name="contentRu"
              rules={[{ required: true, message: "Укажите контент" }]}
            >
              <Editor
                apiKey={"qu8gahwqf4sz5j8567k7fmk76nqedf655jhu2c0d9bhvc0as"}
                onInit={(evt, editor) => {
                  ruEditorRef.current = editor;
                }}
                initialValue=""
                onEditorChange={(content) => {
                  if (typeof content === "string") {
                    form.setFieldsValue({
                      contentRu: content,
                    });
                  }
                }}
                plugins={["lists", "link", "image", "media"]}
                toolbar="lists link image media"
              />
            </Form.Item>
          </div>
        </div>
      </Form>

      {/* Медиа файлы */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Обложка</h3>
          <Upload
            accept="image/*"
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
            onRemove={async () => {
              // Если это существующее изображение (есть url и нет originFileObj), удаляем через API
              if (coverImage && coverImage.url && !coverImage.originFileObj) {
                try {
                  await NewsApi.deleteCover(newsId);
                  antdMessage.success("Обложка удалена");
                } catch (error) {
                  antdMessage.error("Не удалось удалить обложку");
                  return; // Не удаляем из состояния, если ошибка
                }
              }
              setCoverImage(null);
            }}
            fileList={coverImage ? [coverImage] : []}
            itemRender={(originNode, file) => {
              return (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={file.url || (file.thumbUrl)}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              );
            }}
          >
            {!coverImage && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
        </div>
        <div>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Галерея</h3>
          <Upload
            accept="image/*"
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
              // Если это существующее изображение (есть url и нет originFileObj), удаляем через API
              if (file.url && !file.originFileObj && newsData?.gallery) {
                // Находим файл по URL
                const galleryItem = newsData.gallery.find(g => g.link === file.url);
                if (galleryItem) {
                  try {
                    await NewsApi.deleteGalleryImage(newsId, galleryItem.id);
                    antdMessage.success("Изображение удалено");
                  } catch (error) {
                    antdMessage.error("Не удалось удалить изображение");
                    return; // Не удаляем из состояния, если ошибка
                  }
                }
              }
              setImages((prev) => {
                if (file.uid) {
                  return prev.filter((f) => f.uid !== file.uid);
                }
                return prev.filter((f) => f.name !== file.name);
              });
            }}
            fileList={images}
            itemRender={(originNode, file) => {
              return (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img
                    src={file.url || (file.thumbUrl)}
                    alt={file.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              );
            }}
          >
            {images.length < 10 && <div><div className="ant-upload-text">Загрузить</div></div>}
          </Upload>
        </div>
      </div>

      {!canWrite ? (
        <div style={{ marginTop: 16, padding: 12, background: "#fff3cd", borderRadius: 4, color: "#856404" }}>
          Для записи в API войдите (или настройте API базу).
        </div>
      ) : null}
    </div>
  );
}



