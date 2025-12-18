# API_DOCUMENTATION.md — структурированная документация

Источник: `API_DOCUMENTATION.md`

Этот файл собран автоматически: **модули → эндпоинты → авторизация → параметры → примеры**.

## Быстрый индекс

| Модуль | База | Эндпоинтов |
|---|---|---:|
| Авторизация | /auth | 5 |
| Пользователи | /user | 5 |
| Новости | /news | 8 |
| Депутаты | /persons | 23 |
| Документы | /documents | 10 |
| Календарь событий | /calendar | 11 |
| Обращения | /appeals | 7 |
| Комментарии | /comments | 6 |
| Слайдер | /slider | 7 |
| Поиск | /search | 1 |
| О сайте | /about | 9 |
| Доступность | /accessibility | 2 |
| Переводы | /translation | 2 |
| Файлы | /files | 2 |
| Резервное копирование | /backup | 4 |
| Экспорт в социальные сети | /social-export | 4 |
| ЕСИА (Единая система идентификации и аутентификации) | /esia | 2 |

## Авторизация (/auth)

### POST /auth/login

- **Описание**: Вход по телефону
- **Доступ**: public
- **Request fields (по примеру)**: `phone`

**Пример запроса:**

```json
{
  "phone": "+79991234567"
}
```

**Примечания:**
- Примечание: В текущей реализации проверка SMS-кода отключена.

### POST /auth/login/password

- **Описание**: Вход по email и паролю
- **Доступ**: public
- **Request fields (по примеру)**: `email`, `password`

**Пример запроса:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
### POST /auth/refresh

- **Описание**: Обновление токена
- **Доступ**: public
- **Request fields (по примеру)**: `refresh`

**Пример запроса:**

```json
{
  "refresh": "<refresh_token>"
}
```
### POST /auth/password/reset

- **Описание**: Сброс пароля
- **Доступ**: public
- **Request fields (по примеру)**: `email`

**Пример запроса:**

```json
{
  "email": "user@example.com"
}
```

**Примечания:**
- Примечание: Только для администраторов.

### POST /auth/password/reset/:id

- **Описание**: Установка нового пароля
- **Доступ**: public
- **Request fields (по примеру)**: `email`, `password`

**Пример запроса:**

```json
{
  "email": "user@example.com",
  "password": "NewSecurePassword123!"
}
```
## Пользователи (/user)

### POST /user/

- **Описание**: Регистрация нового пользователя
- **Доступ**: public
- **Request fields (по примеру)**: `surname`, `name`, `phone`, `email`, `password`, `role`

**Пример запроса:**

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
### GET /user/me

- **Описание**: Получить информацию о текущем пользователе
- **Доступ**: public
### PATCH /user/me

- **Описание**: Обновить профиль текущего пользователя
- **Доступ**: public
- **Request fields (по примеру)**: `surname`, `name`, `patronymic`, `phone`, `email`

**Пример запроса:**

```json
{
  "surname": "Петров",
  "name": "Петр",
  "patronymic": "Петрович",
  "phone": "+79991234568",
  "email": "petr@example.com"
}
```
### PATCH /user/me/avatar

- **Описание**: Загрузить аватар
- **Доступ**: public
### GET /user/find?many=true&phone=+79991234567

- **Описание**: Поиск пользователей (только для администраторов)
- **Доступ**: admin
## Новости (/news)

### GET /news?categoryId=1&year=2024

- **Описание**: Получить список новостей
- **Доступ**: public
### GET /news/:id

- **Описание**: Получить новость по ID
- **Доступ**: public
### POST /news

- **Описание**: Создать новость (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `title`, `slug`, `shortDescription`, `content`, `categoryId`, `publishedAt`, `coverImageId`, `galleryIds`, `isPublished`

**Пример запроса:**

```json
{
  "title": "Заголовок новости",
  "slug": "zagolovok-novosti",
  "shortDescription": "Краткое описание",
  "content": "<p>HTML контент</p>",
  "categoryId": 1,
  "publishedAt": 1721049600000,
  "coverImageId": "file-uuid",
  "galleryIds": [
    "file-uuid-1",
    "file-uuid-2"
  ],
  "isPublished": true
}
```
### POST /news/:id/cover

- **Описание**: Загрузить обложку новости (только для администраторов)
- **Доступ**: admin
### POST /news/:id/gallery

- **Описание**: Загрузить галерею для новости (только для администраторов)
- **Доступ**: admin
### DELETE /news/:id

- **Описание**: Удалить новость (только для администраторов)
- **Доступ**: admin
### GET /news/categories/all

- **Описание**: Получить все категории новостей
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /news/categories

- **Описание**: Создать категорию новостей (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Новая категория"
}
```
## Депутаты (/persons)

### GET /persons?districtId=1&convocationId=1&factionId=1

- **Описание**: Получить список депутатов
- **Доступ**: public
### GET /persons/:id

- **Описание**: Получить депутата по ID
- **Доступ**: public
### POST /persons

- **Описание**: Создать депутата (только для администраторов)
- **Доступ**: admin
### PATCH /persons/:id

- **Описание**: Обновить депутата (только для администраторов)
- **Доступ**: admin
### POST /persons/:id/media

- **Описание**: Загрузить фотографию депутата (только для администраторов)
- **Доступ**: admin
### POST /persons/:id/declarations

- **Описание**: Добавить декларацию депутата (только для администраторов)
- **Доступ**: admin
### GET /persons/:id/declarations

- **Описание**: Получить декларации депутата
- **Доступ**: public
### DELETE /persons/:id/declarations/:declarationId

- **Описание**: Удалить декларацию (только для администраторов)
- **Доступ**: admin
### DELETE /persons/:id

- **Описание**: Удалить депутата (только для администраторов)
- **Доступ**: admin
### GET /persons/categories/all

- **Описание**: Получить все категории депутатов
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /persons/categories

- **Описание**: Создать категорию депутатов (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Новая категория"
}
```
### GET /persons/factions/all

- **Описание**: Получить все фракции
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /persons/factions

- **Описание**: Создать фракцию (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Новая фракция"
}
```
### PUT /persons/factions/:id

- **Описание**: Обновить фракцию (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Обновленное название"
}
```
### DELETE /persons/factions/:id

- **Описание**: Удалить фракцию (только для администраторов)
- **Доступ**: admin
### GET /persons/districts/all

- **Описание**: Получить все округа
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /persons/districts

- **Описание**: Создать округ (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Новый округ"
}
```
### PUT /persons/districts/:id

- **Описание**: Обновить округ (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Обновленное название"
}
```
### DELETE /persons/districts/:id

- **Описание**: Удалить округ (только для администраторов)
- **Доступ**: admin
### GET /persons/convocations/all

- **Описание**: Получить все созывы
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /persons/convocations

- **Описание**: Создать созыв (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "VIII созыв"
}
```
### PUT /persons/convocations/:id

- **Описание**: Обновить созыв (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`

**Пример запроса:**

```json
{
  "name": "Обновленное название"
}
```
### DELETE /persons/convocations/:id

- **Описание**: Удалить созыв (только для администраторов)
- **Доступ**: admin
## Документы (/documents)

### GET /documents?query=

- **Описание**: Получить список документов
- **Доступ**: public
### GET /documents/:id

- **Описание**: Получить документ по ID
- **Доступ**: public
### POST /documents

- **Описание**: Создать документ (только для администраторов)
- **Доступ**: admin
### POST /documents/:id/pdf

- **Описание**: Загрузить PDF файл для документа (только для администраторов)
- **Доступ**: admin
### PATCH /documents/:id

- **Описание**: Обновить документ (только для администраторов)
- **Доступ**: admin
### DELETE /documents/:id

- **Описание**: Удалить документ (только для администраторов)
- **Доступ**: admin
### GET /documents/categories/all

- **Описание**: Получить все категории документов
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /documents/categories

- **Описание**: Создать категорию документов (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`, `parentId`, `order`

**Пример запроса:**

```json
{
  "name": "Новая категория",
  "parentId": 1,
  "order": 2
}
```
### PATCH /documents/categories/:id

- **Описание**: Обновить категорию документов (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`, `parentId`, `order`

**Пример запроса:**

```json
{
  "name": "Обновленное название",
  "parentId": 1,
  "order": 3
}
```
### DELETE /documents/categories/:id

- **Описание**: Удалить категорию документов (только для администраторов)
- **Доступ**: admin
## Календарь событий (/calendar)

### GET /calendar?year=2024&month=1&dateFrom=1721049600000&dateTo=1723641600000&eventTypeId=1

- **Описание**: Получить список событий
- **Доступ**: public
### GET /calendar/month/:year/:month

- **Описание**: Получить события за месяц
- **Доступ**: public
### GET /calendar/year/:year

- **Описание**: Получить события за год
- **Доступ**: public
### GET /calendar/:id

- **Описание**: Получить событие по ID
- **Доступ**: public
### POST /calendar

- **Описание**: Создать событие (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `title`, `description`, `startDate`, `endDate`, `location`, `eventTypeId`, `participantIds`, `isPublic`

**Пример запроса:**

```json
{
  "title": "Заседание комитета",
  "description": "Обсуждение законопроекта",
  "startDate": 1721049600000,
  "endDate": 1721053200000,
  "location": "Зал заседаний",
  "eventTypeId": 1,
  "participantIds": [
    1,
    2,
    3
  ],
  "isPublic": true
}
```
### PATCH /calendar/:id

- **Описание**: Обновить событие (только для администраторов)
- **Доступ**: admin
### DELETE /calendar/:id

- **Описание**: Удалить событие (только для администраторов)
- **Доступ**: admin
### GET /calendar/types/all

- **Описание**: Получить все типы событий
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /calendar/types

- **Описание**: Создать тип события (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`, `color`

**Пример запроса:**

```json
{
  "name": "Новый тип",
  "color": "#FF5733"
}
```
### PATCH /calendar/types/:id

- **Описание**: Обновить тип события (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `name`, `color`

**Пример запроса:**

```json
{
  "name": "Обновленное название",
  "color": "#00FF00"
}
```
### DELETE /calendar/types/:id

- **Описание**: Удалить тип события (только для администраторов)
- **Доступ**: admin
## Обращения (/appeals)

### POST /appeals

- **Описание**: Создать обращение (требуется авторизация)
- **Доступ**: auth
- **Request fields (по примеру)**: `subject`, `message`, `attachmentIds`

**Пример запроса:**

```json
{
  "subject": "Вопрос о законопроекте",
  "message": "Прошу разъяснить положения законопроекта...",
  "attachmentIds": [
    "file-uuid-1",
    "file-uuid-2"
  ]
}
```
### GET /appeals?statusId=1&dateFrom=1721049600000&dateTo=1723641600000

- **Описание**: Получить список обращений
- **Доступ**: public

**Примечания:**
- Примечание:

### GET /appeals/:id

- **Описание**: Получить обращение по ID
- **Доступ**: public

**Примечания:**
- Примечание: Пользователи могут видеть только свои обращения

### GET /appeals/:id/history

- **Описание**: Получить историю изменений обращения
- **Доступ**: public
### PATCH /appeals/:id

- **Описание**: Обновить обращение (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `statusId`, `comment`

**Пример запроса:**

```json
{
  "statusId": 2,
  "comment": "Обращение обработано"
}
```
### DELETE /appeals/:id

- **Описание**: Удалить обращение (только для администраторов)
- **Доступ**: admin
### GET /appeals/statuses/all

- **Описание**: Получить все статусы обращений
- **Доступ**: public
## Комментарии (/comments)

### POST /comments

- **Описание**: Создать комментарий (требуется авторизация)
- **Доступ**: auth
- **Request fields (по примеру)**: `content`, `parentCommentId`, `entityType`, `entityId`

**Пример запроса:**

```json
{
  "content": "Очень интересная статья!",
  "parentCommentId": 1,
  "entityType": "news",
  "entityId": 1
}
```
### GET /comments?entityType=news&entityId=1&onlyApproved=true&includeReplies=true

- **Описание**: Получить список комментариев
- **Доступ**: public
### GET /comments/:id

- **Описание**: Получить комментарий по ID
- **Доступ**: public
### GET /comments/:id/replies

- **Описание**: Получить ответы на комментарий
- **Доступ**: public
### PATCH /comments/:id/approve

- **Описание**: Одобрить/отклонить комментарий (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `approved`

**Пример запроса:**

```json
{
  "approved": true
}
```
### DELETE /comments/:id

- **Описание**: Удалить комментарий (только для администраторов)
- **Доступ**: admin
## Слайдер (/slider)

### GET /slider?all=false

- **Описание**: Получить список слайдов
- **Доступ**: public
### GET /slider/:id

- **Описание**: Получить слайд по ID
- **Доступ**: public
### POST /slider

- **Описание**: Создать слайд (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `title`, `description`, `buttonText`, `buttonLink`, `imageId`, `order`, `isActive`, `autoRotateInterval`

**Пример запроса:**

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
### POST /slider/:id/image

- **Описание**: Загрузить изображение для слайда (только для администраторов)
- **Доступ**: admin
### PATCH /slider/:id

- **Описание**: Обновить слайд (только для администраторов)
- **Доступ**: admin
### POST /slider/reorder

- **Описание**: Изменить порядок слайдов (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `ids`

**Пример запроса:**

```json
{
  "ids": [
    3,
    1,
    2
  ]
}
```
### DELETE /slider/:id

- **Описание**: Удалить слайд (только для администраторов)
- **Доступ**: admin
## Поиск (/search)

### GET /search?query=

- **Описание**: Поиск по сайту
- **Доступ**: public
## О сайте (/about)

### GET /about/pages?locale=ru

- **Описание**: Получить все страницы
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### GET /about/pages/:slug?locale=ru

- **Описание**: Получить страницу по slug
- **Доступ**: public
### POST /about/pages

- **Описание**: Создать страницу (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `slug`, `title`, `content`, `locale`

**Пример запроса:**

```json
{
  "slug": "about-us",
  "title": "О нас",
  "content": "<p>HTML контент</p>",
  "locale": "ru"
}
```
### PATCH /about/pages/:id

- **Описание**: Обновить страницу (только для администраторов)
- **Доступ**: admin
### DELETE /about/pages/:id

- **Описание**: Удалить страницу (только для администраторов)
- **Доступ**: admin
### GET /about/structure

- **Описание**: Получить структуру органов управления
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /about/structure

- **Описание**: Создать элемент структуры (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `title`, `description`, `order`

**Пример запроса:**

```json
{
  "title": "Верховный Хурал",
  "description": "Описание",
  "order": 1
}
```
### PATCH /about/structure/:id

- **Описание**: Обновить элемент структуры (только для администраторов)
- **Доступ**: admin
### DELETE /about/structure/:id

- **Описание**: Удалить элемент структуры (только для администраторов)
- **Доступ**: admin
## Доступность (/accessibility)

### GET /accessibility/settings?sessionId=session-uuid

- **Описание**: Получить настройки доступности
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /accessibility/settings

- **Описание**: Сохранить настройки доступности
- **Доступ**: public
- **Request fields (по примеру)**: `sessionId`, `fontSize`, `colorScheme`, `contrast`, `disableAnimations`

**Пример запроса:**

```json
{
  "sessionId": "session-uuid",
  "fontSize": 18,
  "colorScheme": "dark",
  "contrast": "high",
  "disableAnimations": true
}
```
## Переводы (/translation)

### POST /translation/translate

- **Описание**: Перевести текст (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `text`, `from`, `to`
- **Response keys (по примеру)**: `original`, `translated`, `from`, `to`

**Пример запроса:**

```json
{
  "text": "Привет, мир!",
  "from": "ru",
  "to": "ty"
}
```

**Пример ответа:**

```json
{
  "original": "Привет, мир!",
  "translated": "Экии, дээр!",
  "from": "ru",
  "to": "ty"
}
```
### POST /translation/translate-batch

- **Описание**: Перевести массив текстов (только для администраторов)
- **Доступ**: admin
- **Request fields (по примеру)**: `texts`, `from`, `to`
- **Response keys (по примеру)**: `originals`, `translated`, `from`, `to`

**Пример запроса:**

```json
{
  "texts": [
    "Привет",
    "Мир"
  ],
  "from": "ru",
  "to": "ty"
}
```

**Пример ответа:**

```json
{
  "originals": [
    "Привет",
    "Мир"
  ],
  "translated": [
    "Экии",
    "Дээр"
  ],
  "from": "ru",
  "to": "ty"
}
```
## Файлы (/files)

### GET /files/:id

- **Описание**: Получить файл по ID (deprecated)
- **Доступ**: public

**Примечания:**
- Примечание: Этот эндпоинт устарел, используйте /files/v2/:id

### GET /files/v2/:id

- **Описание**: Получить файл по ID (v2)
- **Доступ**: public

**Примечания:**
- Примечание: Для получения ссылки на файл используйте поле link в объектах, которые содержат файлы (например, coverImage.link, pdfFile.link).

## Резервное копирование (/backup)

### POST /backup

- **Описание**: Создать резервную копию БД
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### GET /backup

- **Описание**: Получить список всех бэкапов
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### POST /backup/:id/restore

- **Описание**: Восстановить БД из бэкапа
- **Доступ**: public
- **Response keys (по примеру)**: `success`

**Пример ответа:**

```json
{
  "success": true
}
```
### DELETE /backup/:id

- **Описание**: Удалить бэкап
- **Доступ**: public
## Экспорт в социальные сети (/social-export)

### POST /social-export/news/:id/vk

- **Описание**: Экспортировать новость в ВКонтакте
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

```json
{
  "data": {
    "success": true,
    "postId": "123456",
    "platform": "vk"
  }
}
```
### POST /social-export/news/:id/telegram

- **Описание**: Экспортировать новость в Telegram
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

```json
{
  "data": {
    "success": true,
    "messageId": 789,
    "platform": "telegram"
  }
}
```
### POST /social-export/news/:id/all

- **Описание**: Экспортировать новость во все соцсети
- **Доступ**: public
- **Response keys (по примеру)**: `data`

**Пример ответа:**

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
### GET /social-export/news/:id/history

- **Описание**: Получить историю экспорта новости
- **Доступ**: public
## ЕСИА (Единая система идентификации и аутентификации) (/esia)

### GET /esia/auth?code=

- **Описание**: Авторизация через ЕСИА
- **Доступ**: auth
- **Response keys (по примеру)**: `message`, `code`, `state`

**Пример ответа:**

```json
{
  "message": "ESIA integration not yet implemented. Waiting for API access.",
  "code": "<code>",
  "state": "<state>"
}
```
### GET /esia/callback

- **Описание**: Callback от ЕСИА
- **Доступ**: public
- **Response keys (по примеру)**: `message`

**Пример ответа:**

```json
{
  "message": "ESIA callback endpoint. Will be implemented when API access is granted."
}
```
---
Generated at: 2025-12-18T14:09:04.176Z
