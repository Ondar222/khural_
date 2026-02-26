# Структура данных страниц (Pages API)

## Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                         Pages                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Page (Страница)                                     │   │
│  │  - id: string                                        │   │
│  │  - slug: string (уникальный путь, напр. "about/team")│   │
│  │  - parentId?: string (ссылка на родительскую страницу)│  │
│  │  - isPublished: boolean                              │   │
│  │  - order: number                                     │   │
│  │  - createdAt: datetime                               │   │
│  │  - updatedAt: datetime                               │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Content[] (Массив контента по локалям)        │  │   │
│  │  │  - locale: "ru" | "tyv"                        │  │   │
│  │  │  - title: string                               │  │   │
│  │  │  - content: string (HTML/Markdown)             │  │   │
│  │  │  - description?: string                        │  │   │
│  │  │                                                │  │   │
│  │  │  ┌──────────────────────────────────────────┐  │  │   │
│  │  │  │  Blocks[] (Блоки контента)               │  │  │   │
│  │  │  │  - id: string                            │  │  │   │
│  │  │  │  - type: BlockType                       │  │  │   │
│  │  │  │  - order: number                         │  │  │   │
│  │  │  │  - content?: string                      │  │  │   │
│  │  │  │  - fileId?: string                       │  │  │   │
│  │  │  │  - fileIds?: string[]                    │  │  │   │
│  │  │  │  - caption?: string                      │  │  │   │
│  │  │  │  - alt?: string                          │  │  │   │
│  │  │  │  - metadata?: object                     │  │  │   │
│  │  │  └──────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Иерархия страниц

Страницы могут иметь древовидную структуру через поле `parentId`:

```
/ (Главная)
├── about
│   ├── history
│   ├── structure
│   └── contacts
├── deputies
│   ├── current
│   └── archive
├── documents
│   ├── laws
│   ├── resolutions
│   └── initiatives
└── activity
    ├── reports
    └── statistics
```

## Типы блоков (BlockType)

### 1. `text` - Текстовый блок
```json
{
  "type": "text",
  "order": 0,
  "content": "<p>Текст блока в формате HTML</p>"
}
```

### 2. `image` - Изображение
```json
{
  "type": "image",
  "order": 1,
  "fileId": "file-uuid-123",
  "alt": "Описание изображения",
  "caption": "Подпись к изображению"
}
```

### 3. `gallery` - Галерея изображений
```json
{
  "type": "gallery",
  "order": 2,
  "fileIds": ["file-uuid-1", "file-uuid-2", "file-uuid-3"],
  "caption": "Подпись к галерее"
}
```

### 4. `file` - Документ/файл
```json
{
  "type": "file",
  "order": 3,
  "fileId": "file-uuid-456",
  "caption": "Подпись к документу"
}
```

### 5. `link` - Ссылка
```json
{
  "type": "link",
  "order": 4,
  "content": "https://example.com",
  "caption": "Текст ссылки"
}
```

### 6. `quote` - Цитата
```json
{
  "type": "quote",
  "order": 5,
  "content": "Текст цитаты",
  "caption": "Автор цитаты"
}
```

### 7. `video` - Видео
```json
{
  "type": "video",
  "order": 6,
  "content": "https://www.youtube.com/embed/VIDEO_ID",
  "caption": "Подпись к видео"
}
```

## API Endpoints

### Получение списка страниц
```
GET /pages?locale=ru&publishedOnly=true
GET /pages?tree=true
```

### Получение страницы по slug
```
GET /pages/slug/:slug
```

### Создание страницы
```
POST /pages
Body: {
  "slug": "about/history",
  "title": "История",
  "isPublished": true,
  "locale": "ru",
  "content": [
    {
      "locale": "ru",
      "title": "История",
      "content": "<p>Текст страницы</p>",
      "blocks": [
        { "type": "text", "content": "..." },
        { "type": "image", "fileId": "...", "alt": "...", "caption": "..." }
      ]
    }
  ]
}
```

### Обновление страницы
```
PATCH /pages/:id
```

### Удаление страницы
```
DELETE /pages/:id
```

## Пример использования в админке

### Создание страницы с блоками

```javascript
const newPage = {
  slug: "about/team",
  title: "Команда",
  isPublished: true,
  locale: "ru",
  content: [
    {
      locale: "ru",
      title: "Команда",
      content: "<p>Наша команда профессионалов</p>",
      blocks: [
        {
          type: "text",
          order: 0,
          content: "<p>Мы работаем с 2020 года</p>"
        },
        {
          type: "image",
          order: 1,
          fileId: "abc-123",
          alt: "Фото офиса",
          caption: "Наш офис"
        },
        {
          type: "gallery",
          order: 2,
          fileIds: ["img-1", "img-2", "img-3"],
          caption: "Наши мероприятия"
        },
        {
          type: "quote",
          order: 3,
          content: "Вместе мы можем больше!",
          caption: "Генеральный директор"
        }
      ]
    }
  ]
};
```

## Frontend Overrides

Для дополнительных метаданных (названия в меню) используются client-side overrides:

```javascript
// Сохранение в localStorage
{
  "khural_pages_overrides": {
    "pages": {
      "page-id-123": {
        "menuTitle": "О Хурале",
        "submenuTitle": "О парламенте"
      }
    }
  }
}
```

## Рендеринг на странице

Компонент `SectionCmsDetail` получает страницу по slug и рендерит блоки:

```jsx
{blocks.map((block) => {
  switch (block.type) {
    case 'text':
      return <div key={block.id} dangerouslySetInnerHTML={{ __html: block.content }} />;
    case 'image':
      return <Image key={block.id} src={getFileUrl(block.fileId)} alt={block.alt} caption={block.caption} />;
    case 'gallery':
      return <Gallery key={block.id} images={block.fileIds} caption={block.caption} />;
    case 'file':
      return <FileLink key={block.id} fileId={block.fileId} caption={block.caption} />;
    case 'link':
      return <a key={block.id} href={block.content}>{block.caption}</a>;
    case 'quote':
      return <blockquote key={block.id}>{block.content}<cite>{block.caption}</cite></blockquote>;
    case 'video':
      return <iframe key={block.id} src={block.content} title={block.caption} />;
  }
})}
```
