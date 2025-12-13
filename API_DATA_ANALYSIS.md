# Анализ данных, приходящих с бекенда

## 📋 Обзор API эндпоинтов

### 1. **News (Новости)** - `/news`

#### GET `/news` - Получить все новости
**Возвращает:**
```typescript
Array<NewsEntity> {
  id: number;
  created_at: Date;  // snake_case после трансформации
  content?: NewsContentEntity[] | null;
  images?: Files[] | null;  // Трансформируется в формат с CDN
}
```

**Структура `content`:**
```typescript
NewsContentEntity[] {
  id: number;
  lang: string;
  title: string;
  description: string;
  news: NewsEntity;  // Связь с родительской новостью
}
```

**Структура `images` (после `@AfterLoad`):**
```typescript
Files[] {
  file: {
    id: string;  // UUID
    link: string;  // `${CDN}${id}` = `http://localhost:3000/${id}`
  }
}
```

#### POST `/news` - Создать новость
**Принимает:**
```typescript
CreateNewsDto {
  content: NewsContentEntity[];
}
```

**Возвращает:** Созданная `NewsEntity`

#### POST `/news/:id/media` - Загрузить медиа
**Принимает:** `multipart/form-data` с файлами
**Возвращает:**
```typescript
{
  images: number;  // Количество загруженных изображений
}
```

---

### 2. **Persons (Персоны/Депутаты)** - `/persons`

#### GET `/persons` - Получить всех персон
**Возвращает:**
```typescript
Array<PersonEntity> {
  id: number;
  full_name: string;  // snake_case
  district?: string;
  city?: string;
  electoral_district?: string;
  faction?: string;
  committee?: string;
  description?: string;
  education?: string;
  work_experience?: string;
  email?: string;
  phone_number?: string;
  date_of_birth?: Date;
  place_of_birth?: string;
  start_date?: Date;
  categories?: Category[];  // Связь ManyToMany
  image?: {
    id: string;  // UUID
    link: string;  // `${CDN}${id}` = `http://localhost:3000/${id}`
  } | null;
}
```

**Структура `categories`:**
```typescript
Category[] {
  id: number;
  name: string;
}
```

#### GET `/persons/:id` - Получить персону по ID
**Возвращает:** Одна `PersonEntity` с полными данными

#### GET `/persons/faction/:faction` - Получить по фракции
**Возвращает:** `Array<PersonEntity>`

#### POST `/persons` - Создать персону
**Принимает:**
```typescript
CreatePersonDto {
  fullName: string;
  district?: string;
  city?: string;
  electoralDistrict?: string;
  faction?: string;
  committee?: string;
  description?: string;
  education?: string;
  workExperience?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  placeOfBirth?: string;
  startDate?: Date;
  categoryIds?: number[];
}
```

---

### 3. **Auth (Аутентификация)** - `/auth`

#### POST `/auth/register` - Регистрация
**Принимает:**
```typescript
RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

**Возвращает:**
```typescript
{
  user: User;
  token: string;  // JWT токен
}
```

#### POST `/auth/login` - Вход
**Принимает:**
```typescript
LoginDto {
  email: string;
  password: string;
}
```

**Возвращает:**
```typescript
{
  user: User;
  token: string;  // JWT токен
}
```

#### GET `/auth/profile` - Профиль (требует авторизации)
**Возвращает:** `User` объект

---

### 4. **Files (Файлы)** - `/files`

#### GET `/files/v2/:id` - Получить файл по ID
**Возвращает:** Файл напрямую (stream)

---

## 🔄 Трансформации данных

### 1. **Snake Case Conversion**
В проекте есть `SnakeCaser` interceptor, но он **НЕ используется глобально**. 
Данные возвращаются в том формате, в котором они хранятся в БД (snake_case для полей БД).

### 2. **CDN URL Transformation**
В сущностях используется декоратор `@AfterLoad()` для автоматической трансформации:

**NewsEntity:**
```typescript
@AfterLoad()
setCdnUrl() {
  this.images = this.images?.map((img) => ({
    file: {
      id: img.id,
      link: `${process.env.CDN}${img.id}`
    }
  }));
}
```

**PersonEntity:**
```typescript
@AfterLoad()
setCdnUrl() {
  this.image = {
    id: this.image?.id,
    link: `${process.env.CDN}${this.image?.id}`
  };
}
```

### 3. **Relations Loading**
- `NewsEntity.findAll()` загружает `content` и `images` через `relations`
- `PersonEntity.findAll()` загружает `categories` и `image` через `relations`

---

## ⚠️ Несоответствия между Backend и Frontend

### 1. **News (Новости)**

**Backend возвращает:**
```json
{
  "id": 1,
  "created_at": "2025-12-13T...",
  "content": [
    {
      "id": 1,
      "lang": "ru",
      "title": "Заголовок",
      "description": "Описание"
    }
  ],
  "images": [
    {
      "file": {
        "id": "uuid",
        "link": "http://localhost:3000/uuid"
      }
    }
  ]
}
```

**Frontend ожидает:**
```json
{
  "id": "1",
  "title": "Заголовок",  // Из content[0].title
  "category": "Новости",
  "date": "2025-12-13T...",  // Из created_at
  "excerpt": "...",  // Из content[0].description
  "content": [...]  // Массив content объектов
}
```

**Проблемы:**
- ❌ Frontend ожидает `title` на верхнем уровне, но бекенд возвращает его в `content[0].title`
- ❌ Frontend ожидает `excerpt`, но бекенд возвращает `content[0].description`
- ❌ Frontend ожидает `date`, но бекенд возвращает `created_at`
- ❌ Frontend ожидает `category`, но бекенд не возвращает категории для новостей
- ✅ Frontend правильно обрабатывает массив `content`

### 2. **Persons (Персоны)**

**Backend возвращает:**
```json
{
  "id": 1,
  "full_name": "Иванов Иван Иванович",
  "electoral_district": "1",
  "faction": "Партия",
  "phone_number": "+7...",
  "email": "email@example.com",
  "image": {
    "id": "uuid",
    "link": "http://localhost:3000/uuid"
  }
}
```

**Frontend ожидает:**
```json
{
  "id": 1,
  "name": "Иванов Иван Иванович",  // Из full_name
  "district": "1",  // Из electoral_district
  "faction": "Партия",
  "photo": "http://localhost:3000/uuid",  // Из image.link
  "contacts": {
    "phone": "+7...",  // Из phone_number
    "email": "email@example.com"
  }
}
```

**Проблемы:**
- ❌ Frontend ожидает `name`, но бекенд возвращает `full_name`
- ❌ Frontend ожидает `district`, но бекенд возвращает `electoral_district`
- ❌ Frontend ожидает `photo`, но бекенд возвращает `image.link`
- ❌ Frontend ожидает вложенный объект `contacts`, но бекенд возвращает плоскую структуру

---

## 🔧 Рекомендации по исправлению

### Вариант 1: Изменить Backend (рекомендуется)
Создать DTO для ответов, которые соответствуют ожиданиям frontend:

```typescript
// news-response.dto.ts
export class NewsResponseDto {
  id: number;
  title: string;
  category: string;
  date: string;
  excerpt: string;
  content: NewsContentEntity[];
  images: { file: { id: string; link: string } }[];
}
```

### Вариант 2: Улучшить маппинг в Frontend
Текущий маппинг в `DataContext.jsx` частично решает проблему, но можно улучшить:

```javascript
const mapped = apiNews.map((n) => {
  const firstContent = Array.isArray(n.content) && n.content.length > 0 
    ? n.content[0] 
    : {};
  
  return {
    id: String(n.id),
    title: firstContent.title || "",
    category: n.category?.name || "Новости",
    date: n.created_at || n.createdAt || new Date().toISOString(),
    excerpt: firstContent.description || "",
    content: n.content || [],
    images: n.images || []
  };
});
```

---

## 📊 Сводная таблица эндпоинтов

| Метод | Путь | Описание | Требует Auth |
|-------|------|----------|--------------|
| GET | `/news` | Список новостей | ❌ |
| GET | `/news/:id` | Новость по ID | ❌ |
| POST | `/news` | Создать новость | ✅ |
| POST | `/news/:id/media` | Загрузить медиа | ✅ |
| DELETE | `/news/:id` | Удалить новость | ✅ |
| GET | `/persons` | Список персон | ❌ |
| GET | `/persons/:id` | Персона по ID | ❌ |
| GET | `/persons/faction/:faction` | По фракции | ❌ |
| POST | `/persons` | Создать персону | ✅ |
| DELETE | `/persons/:id` | Удалить персону | ✅ |
| POST | `/auth/register` | Регистрация | ❌ |
| POST | `/auth/login` | Вход | ❌ |
| GET | `/auth/profile` | Профиль | ✅ |
| GET | `/files/v2/:id` | Получить файл | ❌ |

---

## 🎯 Выводы

1. **Backend возвращает данные в snake_case** (стандарт для PostgreSQL)
2. **CDN URLs автоматически добавляются** через `@AfterLoad()` декораторы
3. **Relations загружаются** через TypeORM `relations` опцию
4. **Frontend делает маппинг** данных в `DataContext.jsx`, но он неполный
5. **Есть несоответствия** в структуре данных между backend и frontend

Рекомендуется либо:
- Создать Response DTOs в backend для стандартизации формата
- Или улучшить маппинг в frontend для полной обработки всех полей

