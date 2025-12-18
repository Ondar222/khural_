# Документация API для фронтенд-разработчика

## Общая информация

**Базовый URL:** `http://localhost:4000` (или ваш production URL)

**Swagger документация:** `http://localhost:4000/api`

**Формат данных:** JSON (кроме загрузки файлов - multipart/form-data)

**Версия API:** 1.0

---

## Аутентификация

API использует JWT токены для аутентификации. Большинство эндпоинтов требуют авторизации.

### Типы токенов

- **Access Token** - короткоживущий токен для доступа к API (передается в заголовке `Authorization: Bearer <token>`)
- **Refresh Token** - долгоживущий токен для обновления access token

### Структура ответа авторизации

```typescript
{
  data: {
    access_token: string;        // JWT токен для доступа
    expires: number;              // Время истечения access token (timestamp)
    refresh_token: string;        // Токен для обновления
    refresh_expire_date: number;  // Время истечения refresh token (timestamp)
    user: string;                 // ID пользователя
  }
}
```

---

## Роли пользователей

- `admin` - администратор (полный доступ)
- `citizen` - гражданин (ограниченный доступ)

---

## Эндпоинты

### Авторизация (`/auth`)

#### 1. Вход по телефону
```
POST /auth/login
```

**Тело запроса:**
```json
{
  "phone": "+79991234567"
}
```

**Ответ:** `IUserCredentials` (см. структуру выше)

**Примечание:** В текущей реализации проверка SMS-кода отключена.

---

#### 2. Вход по email и паролю
```
POST /auth/login/password
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Ответ:** `IUserCredentials`

---

#### 3. Обновление токена
```
POST /auth/refresh
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Ответ:** `IUserCredentials`

---

#### 4. Сброс пароля
```
POST /auth/password/reset
```

**Тело запроса:**
```json
{
  "email": "user@example.com"
}
```

**Ответ:** `201 Created`

**Примечание:** Только для администраторов.

---

#### 5. Установка нового пароля
```
POST /auth/password/reset/:id
```

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "NewSecurePassword123!"
}
```

**Ответ:** `201 Created`

---

### Пользователи (`/user`)

#### 1. Регистрация нового пользователя
```
POST /user/
```

**Тело запроса:**
```json
{
  "surname": "Иванов",
  "name": "Иван",
  "phone": "+79991234567",
  "email": "ivan@example.com",
  "password": "SecurePassword123!",
  "role": "citizen"
}
```

**Ответ:**
```json
{
  "data": {
    ...IUserCredentials,
    "id": "user-uuid"
  }
}
```

---

#### 2. Получить информацию о текущем пользователе
```
GET /user/me
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": {
    "id": "uuid",
    "surname": "Иванов",
    "name": "Иван",
    "patronymic": "Иванович",
    "phone": "+79991234567",
    "email": "ivan@example.com",
    "role": {
      "id": "citizen",
      "admin_access": false,
      "app_access": true
    },
    "avatar": {
      "id": "file-uuid",
      "link": "https://cdn.example.com/file-uuid"
    }
  }
}
```

---

#### 3. Обновить профиль текущего пользователя
```
PATCH /user/me
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "surname": "Петров",
  "name": "Петр",
  "patronymic": "Петрович",
  "phone": "+79991234568",
  "email": "petr@example.com"
}
```

**Ответ:** Обновленные данные пользователя

---

#### 4. Загрузить аватар
```
PATCH /user/me/avatar
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
avatar: <файл изображения>
```

**Ответ:** Обновленные данные пользователя

---

#### 5. Поиск пользователей (только для администраторов)
```
GET /user/find?many=true&phone=+79991234567
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Query параметры:**
- `many` (boolean) - если `true`, возвращает массив пользователей
- `phone` (string) - фильтр по телефону
- `email` (string) - фильтр по email
- `id` (string) - фильтр по ID

**Ответ:**
```json
{
  "data": User | User[]
}
```

---

### Новости (`/news`)

#### 1. Получить список новостей
```
GET /news?categoryId=1&year=2024
```

**Query параметры:**
- `categoryId` (number, optional) - фильтр по категории
- `year` (number, optional) - фильтр по году публикации

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Заголовок новости",
      "slug": "zagolovok-novosti",
      "shortDescription": "Краткое описание",
      "content": "<p>HTML контент</p>",
      "category": {
        "id": 1,
        "name": "Политика"
      },
      "coverImage": {
        "id": "file-uuid",
        "link": "https://cdn.example.com/file-uuid"
      },
      "gallery": [
        {
          "id": "file-uuid",
          "link": "https://cdn.example.com/file-uuid"
        }
      ],
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "isPublished": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Получить новость по ID
```
GET /news/:id
```

**Ответ:** Объект новости (см. выше)

---

#### 3. Создать новость (только для администраторов)
```
POST /news
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "title": "Заголовок новости",
  "slug": "zagolovok-novosti",
  "shortDescription": "Краткое описание",
  "content": "<p>HTML контент</p>",
  "categoryId": 1,
  "publishedAt": 1721049600000,
  "coverImageId": "file-uuid",
  "galleryIds": ["file-uuid-1", "file-uuid-2"],
  "isPublished": true
}
```

**Ответ:** Созданная новость

---

#### 4. Загрузить обложку новости (только для администраторов)
```
POST /news/:id/cover
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
cover: <файл изображения>
```

**Ответ:** Обновленная новость

---

#### 5. Загрузить галерею для новости (только для администраторов)
```
POST /news/:id/gallery
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
gallery: <массив файлов изображений>
```

**Ответ:** Обновленная новость

---

#### 6. Удалить новость (только для администраторов)
```
DELETE /news/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 7. Получить все категории новостей
```
GET /news/categories/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Политика"
    }
  ]
}
```

---

#### 8. Создать категорию новостей (только для администраторов)
```
POST /news/categories
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новая категория"
}
```

**Ответ:** Созданная категория

---

### Депутаты (`/persons`)

#### 1. Получить список депутатов
```
GET /persons?districtId=1&convocationId=1&factionId=1
```

**Query параметры:**
- `districtId` (number, optional) - фильтр по округу
- `convocationId` (number, optional) - фильтр по созыву
- `factionId` (number, optional) - фильтр по фракции

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "fullName": "Иванов Иван Иванович",
      "city": "Кызыл",
      "electoralDistrict": "Округ №1",
      "committee": "Комитет по законодательству",
      "description": "Описание",
      "education": "Высшее образование",
      "workExperience": "Опыт работы",
      "email": "ivan@example.com",
      "phoneNumber": "+79991234567",
      "dateOfBirth": 1609459200000,
      "placeOfBirth": "Кызыл",
      "startDate": 1609459200000,
      "receptionSchedule": {
        "dayOfWeek": "Понедельник",
        "time": "10:00-12:00",
        "location": "Кабинет 101",
        "notes": "Прием граждан"
      },
      "districts": [
        {
          "id": 1,
          "name": "Округ №1"
        }
      ],
      "factions": [
        {
          "id": 1,
          "name": "Единая Россия"
        }
      ],
      "convocations": [
        {
          "id": 1,
          "name": "VII созыв"
        }
      ],
      "categories": [
        {
          "id": 1,
          "name": "Депутат"
        }
      ],
      "image": {
        "id": "file-uuid",
        "link": "https://cdn.example.com/file-uuid"
      }
    }
  ]
}
```

---

#### 2. Получить депутата по ID
```
GET /persons/:id
```

**Ответ:** Объект депутата (см. выше)

---

#### 3. Создать депутата (только для администраторов)
```
POST /persons
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "fullName": "Иванов Иван Иванович",
  "districtIds": [1, 2],
  "city": "Кызыл",
  "electoralDistrict": "Округ №1",
  "factionIds": [1],
  "committee": "Комитет по законодательству",
  "description": "Описание",
  "education": "Высшее образование",
  "workExperience": "Опыт работы",
  "email": "ivan@example.com",
  "phoneNumber": "+79991234567",
  "dateOfBirth": 1609459200000,
  "placeOfBirth": "Кызыл",
  "startDate": 1609459200000,
  "convocationIds": [1],
  "receptionSchedule": {
    "dayOfWeek": "Понедельник",
    "time": "10:00-12:00",
    "location": "Кабинет 101",
    "notes": "Прием граждан"
  },
  "categoryIds": [1]
}
```

**Ответ:** Созданный депутат

---

#### 4. Обновить депутата (только для администраторов)
```
PATCH /persons/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленный депутат

---

#### 5. Загрузить фотографию депутата (только для администраторов)
```
POST /persons/:id/media
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
image: <файл изображения>
```

**Ответ:** Обновленный депутат

---

#### 6. Добавить декларацию депутата (только для администраторов)
```
POST /persons/:id/declarations
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
pdf: <PDF файл>
type: "income" | "assets"
year: "2024"
description: "Декларация о доходах за 2024 год"
```

**Ответ:** Обновленный депутат с декларациями

---

#### 7. Получить декларации депутата
```
GET /persons/:id/declarations
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "type": "income",
      "year": "2024",
      "description": "Декларация о доходах",
      "pdfFile": {
        "id": "file-uuid",
        "link": "https://cdn.example.com/file-uuid"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 8. Удалить декларацию (только для администраторов)
```
DELETE /persons/:id/declarations/:declarationId
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 9. Удалить депутата (только для администраторов)
```
DELETE /persons/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 10. Получить все категории депутатов
```
GET /persons/categories/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Депутат"
    }
  ]
}
```

---

#### 11. Создать категорию депутатов (только для администраторов)
```
POST /persons/categories
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новая категория"
}
```

**Ответ:** Созданная категория

---

#### 12. Получить все фракции
```
GET /persons/factions/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Единая Россия"
    }
  ]
}
```

---

#### 13. Создать фракцию (только для администраторов)
```
POST /persons/factions
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новая фракция"
}
```

**Ответ:** Созданная фракция

---

#### 14. Обновить фракцию (только для администраторов)
```
PUT /persons/factions/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Обновленное название"
}
```

**Ответ:** Обновленная фракция

---

#### 15. Удалить фракцию (только для администраторов)
```
DELETE /persons/factions/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 16. Получить все округа
```
GET /persons/districts/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Округ №1"
    }
  ]
}
```

---

#### 17. Создать округ (только для администраторов)
```
POST /persons/districts
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новый округ"
}
```

**Ответ:** Созданный округ

---

#### 18. Обновить округ (только для администраторов)
```
PUT /persons/districts/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Обновленное название"
}
```

**Ответ:** Обновленный округ

---

#### 19. Удалить округ (только для администраторов)
```
DELETE /persons/districts/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 20. Получить все созывы
```
GET /persons/convocations/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "VII созыв"
    }
  ]
}
```

---

#### 21. Создать созыв (только для администраторов)
```
POST /persons/convocations
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "VIII созыв"
}
```

**Ответ:** Созданный созыв

---

#### 22. Обновить созыв (только для администраторов)
```
PUT /persons/convocations/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Обновленное название"
}
```

**Ответ:** Обновленный созыв

---

#### 23. Удалить созыв (только для администраторов)
```
DELETE /persons/convocations/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Документы (`/documents`)

#### 1. Получить список документов
```
GET /documents?query=закон&categoryId=1&type=law&year=2024&page=1&limit=20
```

**Query параметры:**
- `query` (string, optional) - поисковый запрос (полнотекстовый поиск)
- `categoryId` (number, optional) - фильтр по категории
- `type` (enum, optional) - тип документа: `law`, `resolution`, `decision`, `order`, `other`
- `year` (number, optional) - фильтр по году
- `page` (number, optional) - номер страницы
- `limit` (number, optional) - количество на странице

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "О внесении изменений в закон...",
      "number": "123-ЗРТ",
      "type": "law",
      "content": "Текст документа для поиска",
      "category": {
        "id": 1,
        "name": "Законы"
      },
      "pdfFile": {
        "id": "file-uuid",
        "link": "https://cdn.example.com/file-uuid"
      },
      "metadata": {
        "author": "Верховный Хурал РТ",
        "department": "Комитет по законодательству",
        "keywords": ["закон", "изменения"]
      },
      "publishedAt": "2024-01-15T10:00:00.000Z",
      "isPublished": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

#### 2. Получить документ по ID
```
GET /documents/:id
```

**Ответ:** Объект документа (см. выше)

---

#### 3. Создать документ (только для администраторов)
```
POST /documents
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "title": "О внесении изменений в закон...",
  "number": "123-ЗРТ",
  "type": "law",
  "content": "Текст документа для полнотекстового поиска",
  "categoryId": 1,
  "pdfFileId": "file-uuid",
  "metadata": {
    "author": "Верховный Хурал РТ",
    "department": "Комитет по законодательству",
    "keywords": ["закон", "изменения"]
  },
  "publishedAt": 1721049600000,
  "isPublished": true
}
```

**Ответ:** Созданный документ

---

#### 4. Загрузить PDF файл для документа (только для администраторов)
```
POST /documents/:id/pdf
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
pdf: <PDF файл>
```

**Ответ:** Обновленный документ

---

#### 5. Обновить документ (только для администраторов)
```
PATCH /documents/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленный документ

---

#### 6. Удалить документ (только для администраторов)
```
DELETE /documents/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 7. Получить все категории документов
```
GET /documents/categories/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Законы",
      "parentId": null,
      "order": 1
    }
  ]
}
```

---

#### 8. Создать категорию документов (только для администраторов)
```
POST /documents/categories
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новая категория",
  "parentId": 1,
  "order": 2
}
```

**Ответ:** Созданная категория

---

#### 9. Обновить категорию документов (только для администраторов)
```
PATCH /documents/categories/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Обновленное название",
  "parentId": 1,
  "order": 3
}
```

**Ответ:** Обновленная категория

---

#### 10. Удалить категорию документов (только для администраторов)
```
DELETE /documents/categories/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Календарь событий (`/calendar`)

#### 1. Получить список событий
```
GET /calendar?year=2024&month=1&dateFrom=1721049600000&dateTo=1723641600000&eventTypeId=1
```

**Query параметры:**
- `year` (number, optional) - фильтр по году
- `month` (number, optional) - фильтр по месяцу (1-12)
- `dateFrom` (number, optional) - начальная дата (timestamp)
- `dateTo` (number, optional) - конечная дата (timestamp)
- `eventTypeId` (number, optional) - фильтр по типу события

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Заседание комитета",
      "description": "Обсуждение законопроекта",
      "startDate": "2024-01-15T10:00:00.000Z",
      "endDate": "2024-01-15T12:00:00.000Z",
      "location": "Зал заседаний",
      "eventType": {
        "id": 1,
        "name": "Заседание",
        "color": "#FF5733"
      },
      "participants": [
        {
          "id": 1,
          "fullName": "Иванов Иван Иванович"
        }
      ],
      "isPublic": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Получить события за месяц
```
GET /calendar/month/:year/:month
```

**Пример:**
```
GET /calendar/month/2024/1
```

**Ответ:** Массив событий за указанный месяц

---

#### 3. Получить события за год
```
GET /calendar/year/:year
```

**Пример:**
```
GET /calendar/year/2024
```

**Ответ:** Массив событий за указанный год

---

#### 4. Получить событие по ID
```
GET /calendar/:id
```

**Ответ:** Объект события (см. выше)

---

#### 5. Создать событие (только для администраторов)
```
POST /calendar
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "title": "Заседание комитета",
  "description": "Обсуждение законопроекта",
  "startDate": 1721049600000,
  "endDate": 1721053200000,
  "location": "Зал заседаний",
  "eventTypeId": 1,
  "participantIds": [1, 2, 3],
  "isPublic": true
}
```

**Ответ:** Созданное событие

---

#### 6. Обновить событие (только для администраторов)
```
PATCH /calendar/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленное событие

---

#### 7. Удалить событие (только для администраторов)
```
DELETE /calendar/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 8. Получить все типы событий
```
GET /calendar/types/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Заседание",
      "color": "#FF5733"
    }
  ]
}
```

---

#### 9. Создать тип события (только для администраторов)
```
POST /calendar/types
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Новый тип",
  "color": "#FF5733"
}
```

**Ответ:** Созданный тип события

---

#### 10. Обновить тип события (только для администраторов)
```
PATCH /calendar/types/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "name": "Обновленное название",
  "color": "#00FF00"
}
```

**Ответ:** Обновленный тип события

---

#### 11. Удалить тип события (только для администраторов)
```
DELETE /calendar/types/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Обращения (`/appeals`)

#### 1. Создать обращение (требуется авторизация)
```
POST /appeals
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "subject": "Вопрос о законопроекте",
  "message": "Прошу разъяснить положения законопроекта...",
  "attachmentIds": ["file-uuid-1", "file-uuid-2"]
}
```

**Ответ:** Созданное обращение

---

#### 2. Получить список обращений
```
GET /appeals?statusId=1&dateFrom=1721049600000&dateTo=1723641600000
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Query параметры:**
- `statusId` (number, optional) - фильтр по статусу
- `dateFrom` (number, optional) - начальная дата (timestamp)
- `dateTo` (number, optional) - конечная дата (timestamp)

**Примечание:** 
- Администраторы видят все обращения
- Обычные пользователи видят только свои обращения

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "subject": "Вопрос о законопроекте",
      "message": "Прошу разъяснить...",
      "status": {
        "id": 1,
        "name": "Новое"
      },
      "user": {
        "id": "user-uuid",
        "name": "Иван"
      },
      "attachments": [
        {
          "id": "file-uuid",
          "link": "https://cdn.example.com/file-uuid"
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Получить обращение по ID
```
GET /appeals/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Примечание:** Пользователи могут видеть только свои обращения

**Ответ:** Объект обращения (см. выше)

---

#### 4. Получить историю изменений обращения
```
GET /appeals/:id/history
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "status": {
        "id": 1,
        "name": "Новое"
      },
      "comment": "Обращение принято в работу",
      "changedBy": {
        "id": "admin-uuid",
        "name": "Администратор"
      },
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 5. Обновить обращение (только для администраторов)
```
PATCH /appeals/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "statusId": 2,
  "comment": "Обращение обработано"
}
```

**Ответ:** Обновленное обращение

---

#### 6. Удалить обращение (только для администраторов)
```
DELETE /appeals/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 7. Получить все статусы обращений
```
GET /appeals/statuses/all
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Новое"
    },
    {
      "id": 2,
      "name": "В работе"
    },
    {
      "id": 3,
      "name": "Завершено"
    }
  ]
}
```

---

### Комментарии (`/comments`)

#### 1. Создать комментарий (требуется авторизация)
```
POST /comments
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "content": "Очень интересная статья!",
  "parentCommentId": 1,
  "entityType": "news",
  "entityId": 1
}
```

**Параметры:**
- `entityType` - тип сущности: `news` или `document`
- `entityId` - ID сущности
- `parentCommentId` (optional) - ID родительского комментария (для ответов)

**Ответ:** Созданный комментарий

---

#### 2. Получить список комментариев
```
GET /comments?entityType=news&entityId=1&onlyApproved=true&includeReplies=true
```

**Query параметры:**
- `entityType` (required) - тип сущности: `news` или `document`
- `entityId` (required) - ID сущности
- `onlyApproved` (boolean, optional, default: true) - показывать только одобренные
- `includeReplies` (boolean, optional, default: false) - включать ответы

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "content": "Очень интересная статья!",
      "user": {
        "id": "user-uuid",
        "name": "Иван"
      },
      "entityType": "news",
      "entityId": 1,
      "isApproved": true,
      "replies": [
        {
          "id": 2,
          "content": "Согласен!",
          "user": {
            "id": "user-uuid-2",
            "name": "Петр"
          }
        }
      ],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 3. Получить комментарий по ID
```
GET /comments/:id
```

**Ответ:** Объект комментария (см. выше)

---

#### 4. Получить ответы на комментарий
```
GET /comments/:id/replies
```

**Ответ:** Массив ответов

---

#### 5. Одобрить/отклонить комментарий (только для администраторов)
```
PATCH /comments/:id/approve
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "approved": true
}
```

**Ответ:** Обновленный комментарий

---

#### 6. Удалить комментарий (только для администраторов)
```
DELETE /comments/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Слайдер (`/slider`)

#### 1. Получить список слайдов
```
GET /slider?all=false
```

**Query параметры:**
- `all` (boolean, optional, default: false) - показать все слайды, включая неактивные

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Заголовок слайда",
      "description": "Описание",
      "buttonText": "Подробнее",
      "buttonLink": "/news/123",
      "image": {
        "id": "file-uuid",
        "link": "https://cdn.example.com/file-uuid"
      },
      "order": 1,
      "isActive": true,
      "autoRotateInterval": 5000,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

#### 2. Получить слайд по ID
```
GET /slider/:id
```

**Ответ:** Объект слайда (см. выше)

---

#### 3. Создать слайд (только для администраторов)
```
POST /slider
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "title": "Заголовок слайда",
  "description": "Описание",
  "buttonText": "Подробнее",
  "buttonLink": "/news/123",
  "imageId": "file-uuid",
  "order": 1,
  "isActive": true,
  "autoRotateInterval": 5000
}
```

**Ответ:** Созданный слайд

---

#### 4. Загрузить изображение для слайда (только для администраторов)
```
POST /slider/:id/image
```

**Заголовки:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Тело запроса (form-data):**
```
image: <файл изображения>
```

**Ответ:** Обновленный слайд

---

#### 5. Обновить слайд (только для администраторов)
```
PATCH /slider/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленный слайд

---

#### 6. Изменить порядок слайдов (только для администраторов)
```
POST /slider/reorder
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "ids": [3, 1, 2]
}
```

**Ответ:** `200 OK`

---

#### 7. Удалить слайд (только для администраторов)
```
DELETE /slider/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Поиск (`/search`)

#### 1. Поиск по сайту
```
GET /search?query=закон об образовании&contentType=all&page=1&limit=20
```

**Query параметры:**
- `query` (required) - поисковый запрос
- `contentType` (enum, optional) - тип контента: `all`, `news`, `documents`, `persons`
- `contentTypes` (array, optional) - массив типов контента
- `page` (number, optional, default: 1) - номер страницы
- `limit` (number, optional, default: 20) - количество результатов

**Ответ:**
```json
{
  "data": {
    "news": [
      {
        "id": 1,
        "title": "Новость о законе",
        "slug": "novost-o-zakone",
        "shortDescription": "..."
      }
    ],
    "documents": [
      {
        "id": 1,
        "title": "Закон об образовании",
        "number": "123-ЗРТ"
      }
    ],
    "persons": [
      {
        "id": 1,
        "fullName": "Иванов Иван Иванович"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

---

### О сайте (`/about`)

#### 1. Получить все страницы
```
GET /about/pages?locale=ru
```

**Query параметры:**
- `locale` (enum, optional) - локаль: `ru`, `ty` (тувинский)

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "slug": "about-us",
      "title": "О нас",
      "content": "<p>HTML контент</p>",
      "locale": "ru"
    }
  ]
}
```

---

#### 2. Получить страницу по slug
```
GET /about/pages/:slug?locale=ru
```

**Ответ:** Объект страницы (см. выше)

---

#### 3. Создать страницу (только для администраторов)
```
POST /about/pages
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "slug": "about-us",
  "title": "О нас",
  "content": "<p>HTML контент</p>",
  "locale": "ru"
}
```

**Ответ:** Созданная страница

---

#### 4. Обновить страницу (только для администраторов)
```
PATCH /about/pages/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленная страница

---

#### 5. Удалить страницу (только для администраторов)
```
DELETE /about/pages/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

#### 6. Получить структуру органов управления
```
GET /about/structure
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Верховный Хурал",
      "description": "Описание",
      "order": 1
    }
  ]
}
```

---

#### 7. Создать элемент структуры (только для администраторов)
```
POST /about/structure
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "title": "Верховный Хурал",
  "description": "Описание",
  "order": 1
}
```

**Ответ:** Созданный элемент структуры

---

#### 8. Обновить элемент структуры (только для администраторов)
```
PATCH /about/structure/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:** Те же поля, что и при создании (все опциональны)

**Ответ:** Обновленный элемент структуры

---

#### 9. Удалить элемент структуры (только для администраторов)
```
DELETE /about/structure/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Доступность (`/accessibility`)

#### 1. Получить настройки доступности
```
GET /accessibility/settings?sessionId=session-uuid
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Query параметры:**
- `sessionId` (string, optional) - ID сессии (для неавторизованных пользователей)

**Ответ:**
```json
{
  "data": {
    "fontSize": 16,
    "colorScheme": "default",
    "contrast": "normal",
    "disableAnimations": false
  }
}
```

---

#### 2. Сохранить настройки доступности
```
POST /accessibility/settings
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "sessionId": "session-uuid",
  "fontSize": 18,
  "colorScheme": "dark",
  "contrast": "high",
  "disableAnimations": true
}
```

**Ответ:** Сохраненные настройки

---

### Переводы (`/translation`)

#### 1. Перевести текст (только для администраторов)
```
POST /translation/translate
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "text": "Привет, мир!",
  "from": "ru",
  "to": "ty"
}
```

**Параметры:**
- `from` - исходная локаль: `ru`, `ty`
- `to` - целевая локаль: `ru`, `ty`

**Ответ:**
```json
{
  "original": "Привет, мир!",
  "translated": "Экии, дээр!",
  "from": "ru",
  "to": "ty"
}
```

---

#### 2. Перевести массив текстов (только для администраторов)
```
POST /translation/translate-batch
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "texts": ["Привет", "Мир"],
  "from": "ru",
  "to": "ty"
}
```

**Ответ:**
```json
{
  "originals": ["Привет", "Мир"],
  "translated": ["Экии", "Дээр"],
  "from": "ru",
  "to": "ty"
}
```

---

### Файлы (`/files`)

#### 1. Получить файл по ID (deprecated)
```
GET /files/:id
```

**Примечание:** Этот эндпоинт устарел, используйте `/files/v2/:id`

---

#### 2. Получить файл по ID (v2)
```
GET /files/v2/:id
```

**Ответ:** Файл (бинарные данные)

**Примечание:** Для получения ссылки на файл используйте поле `link` в объектах, которые содержат файлы (например, `coverImage.link`, `pdfFile.link`).

---

### Резервное копирование (`/backup`)

**Примечание:** Все эндпоинты доступны только для администраторов.

#### 1. Создать резервную копию БД
```
POST /backup
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": {
    "id": 1,
    "filename": "backup_2024-01-15_10-00-00.sql",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "size": 1024000
  }
}
```

---

#### 2. Получить список всех бэкапов
```
GET /backup
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "filename": "backup_2024-01-15_10-00-00.sql",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "size": 1024000
    }
  ]
}
```

---

#### 3. Восстановить БД из бэкапа
```
POST /backup/:id/restore
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "success": true
}
```

**Внимание:** Эта операция перезапишет текущую базу данных!

---

#### 4. Удалить бэкап
```
DELETE /backup/:id
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:** `204 No Content`

---

### Экспорт в социальные сети (`/social-export`)

**Примечание:** Все эндпоинты доступны только для администраторов.

#### 1. Экспортировать новость в ВКонтакте
```
POST /social-export/news/:id/vk
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": {
    "success": true,
    "postId": "123456",
    "platform": "vk"
  }
}
```

---

#### 2. Экспортировать новость в Telegram
```
POST /social-export/news/:id/telegram
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": {
    "success": true,
    "messageId": 789,
    "platform": "telegram"
  }
}
```

---

#### 3. Экспортировать новость во все соцсети
```
POST /social-export/news/:id/all
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": {
    "vk": {
      "success": true,
      "postId": "123456"
    },
    "telegram": {
      "success": true,
      "messageId": 789
    }
  }
}
```

---

#### 4. Получить историю экспорта новости
```
GET /social-export/news/:id/history
```

**Заголовки:**
```
Authorization: Bearer <access_token>
```

**Ответ:**
```json
{
  "data": [
    {
      "id": 1,
      "platform": "vk",
      "postId": "123456",
      "exportedAt": "2024-01-15T10:00:00.000Z",
      "status": "success"
    },
    {
      "id": 2,
      "platform": "telegram",
      "messageId": 789,
      "exportedAt": "2024-01-15T10:00:00.000Z",
      "status": "success"
    }
  ]
}
```

---

### ЕСИА (Единая система идентификации и аутентификации) (`/esia`)

**Примечание:** Интеграция с ЕСИА находится в разработке. Эндпоинты являются заглушками и будут реализованы после получения доступа к API ЕСИА.

#### 1. Авторизация через ЕСИА
```
GET /esia/auth?code=<code>&state=<state>
```

**Query параметры:**
- `code` (string, optional) - код авторизации от ЕСИА
- `state` (string, optional) - состояние для проверки

**Ответ:**
```json
{
  "message": "ESIA integration not yet implemented. Waiting for API access.",
  "code": "<code>",
  "state": "<state>"
}
```

---

#### 2. Callback от ЕСИА
```
GET /esia/callback
```

**Ответ:**
```json
{
  "message": "ESIA callback endpoint. Will be implemented when API access is granted."
}
```

---

## Коды ошибок

### Стандартные HTTP коды

- `200 OK` - успешный запрос
- `201 Created` - ресурс успешно создан
- `204 No Content` - успешное удаление
- `400 Bad Request` - неверный запрос
- `401 Unauthorized` - требуется авторизация
- `403 Forbidden` - недостаточно прав доступа
- `404 Not Found` - ресурс не найден
- `500 Internal Server Error` - внутренняя ошибка сервера

### Структура ошибки

```json
{
  "statusCode": 400,
  "message": "Описание ошибки",
  "error": "Bad Request"
}
```

---

## Примеры использования

### Пример 1: Авторизация и получение данных пользователя

```javascript
// 1. Вход
const loginResponse = await fetch('http://localhost:4000/auth/login/password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
  }),
});

const { data: credentials } = await loginResponse.json();

// 2. Получение данных пользователя
const userResponse = await fetch('http://localhost:4000/user/me', {
  headers: {
    'Authorization': `Bearer ${credentials.access_token}`,
  },
});

const { data: user } = await userResponse.json();
console.log(user);
```

---

### Пример 2: Создание новости с загрузкой изображения

```javascript
// 1. Создание новости
const newsResponse = await fetch('http://localhost:4000/news', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Новая новость',
    content: '<p>Содержание новости</p>',
    categoryId: 1,
    isPublished: true,
  }),
});

const { data: news } = await newsResponse.json();

// 2. Загрузка обложки
const formData = new FormData();
formData.append('cover', imageFile);

const coverResponse = await fetch(`http://localhost:4000/news/${news.id}/cover`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
  body: formData,
});

const { data: updatedNews } = await coverResponse.json();
console.log(updatedNews);
```

---

### Пример 3: Поиск документов

```javascript
const searchResponse = await fetch(
  'http://localhost:4000/documents?query=закон&type=law&year=2024&page=1&limit=20'
);

const { data: documents, meta } = await searchResponse.json();
console.log('Найдено документов:', meta.pagination.total);
console.log('Документы:', documents);
```

---

## Примечания

1. **Таймстампы**: Все даты передаются в формате timestamp (миллисекунды с 1 января 1970 года).

2. **Файлы**: 
   - Для загрузки файлов используйте `multipart/form-data`
   - Ссылки на файлы доступны через поле `link` в объектах файлов
   - Поддерживаемые форматы изображений: JPG, PNG, GIF
   - Для документов поддерживается только PDF

3. **Пагинация**: Некоторые эндпоинты поддерживают пагинацию через параметры `page` и `limit`.

4. **Локализация**: API поддерживает русский (`ru`) и тувинский (`ty`) языки.

5. **Права доступа**:
   - Эндпоинты, помеченные как "только для администраторов", требуют роль `admin`
   - Эндпоинты, помеченные как "требуется авторизация", требуют любой валидный токен
   - Остальные эндпоинты доступны без авторизации

6. **Swagger**: Полная интерактивная документация доступна по адресу `/api` при запущенном сервере.

---

## Контакты и поддержка

Для вопросов и предложений обращайтесь к команде разработки бэкенда.
