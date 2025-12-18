# API_DOCUMENTATION.md — структурированная документация (v2)

Источник: `API_DOCUMENTATION.md`
Контракты: `API_CONTRACTS.ts` → `API_CONTRACTS_DOCUMENTATION.md`

В этой версии добавлено:
- **Bearer**: определяется по наличию заголовка `Authorization: Bearer ...` в примерах
- **Контракты**: ссылки на типы из `API_CONTRACTS.ts` (где возможно)

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
- **Bearer**: no
- **Контракты**: request: [LoginByPhoneRequest](API_CONTRACTS_DOCUMENTATION.md#loginbyphonerequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[UserCredentials](API_CONTRACTS_DOCUMENTATION.md#usercredentials)>

### POST /auth/login/password

- **Описание**: Вход по email и паролю
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [LoginByEmailRequest](API_CONTRACTS_DOCUMENTATION.md#loginbyemailrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[UserCredentials](API_CONTRACTS_DOCUMENTATION.md#usercredentials)>

### POST /auth/refresh

- **Описание**: Обновление токена
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [RefreshTokenRequest](API_CONTRACTS_DOCUMENTATION.md#refreshtokenrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[UserCredentials](API_CONTRACTS_DOCUMENTATION.md#usercredentials)>

### POST /auth/password/reset

- **Описание**: Сброс пароля
- **Доступ**: admin
- **Bearer**: yes

### POST /auth/password/reset/:id

- **Описание**: Установка нового пароля
- **Доступ**: admin
- **Bearer**: yes

## Пользователи (/user)

### POST /user/

- **Описание**: Регистрация нового пользователя
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [CreateUserRequest](API_CONTRACTS_DOCUMENTATION.md#createuserrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<`any`>

### GET /user/me

- **Описание**: Получить информацию о текущем пользователе
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[User](API_CONTRACTS_DOCUMENTATION.md#user)>

### PATCH /user/me

- **Описание**: Обновить профиль текущего пользователя
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [UpdateUserRequest](API_CONTRACTS_DOCUMENTATION.md#updateuserrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[User](API_CONTRACTS_DOCUMENTATION.md#user)>

### PATCH /user/me/avatar

- **Описание**: Загрузить аватар
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[User](API_CONTRACTS_DOCUMENTATION.md#user)>

### GET /user/find?many=true&phone=+79991234567

- **Описание**: Поиск пользователей (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [UserSearchQuery](API_CONTRACTS_DOCUMENTATION.md#usersearchquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[User](API_CONTRACTS_DOCUMENTATION.md#user)>

## Новости (/news)

### GET /news?categoryId=1&year=2024

- **Описание**: Получить список новостей
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [NewsListQuery](API_CONTRACTS_DOCUMENTATION.md#newslistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[News](API_CONTRACTS_DOCUMENTATION.md#news)>

### GET /news/:id

- **Описание**: Получить новость по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [NewsListQuery](API_CONTRACTS_DOCUMENTATION.md#newslistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[News](API_CONTRACTS_DOCUMENTATION.md#news)>

### POST /news

- **Описание**: Создать новость (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [CreateNewsRequest](API_CONTRACTS_DOCUMENTATION.md#createnewsrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[News](API_CONTRACTS_DOCUMENTATION.md#news)>

### POST /news/:id/cover

- **Описание**: Загрузить обложку новости (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### POST /news/:id/gallery

- **Описание**: Загрузить галерею для новости (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /news/:id

- **Описание**: Удалить новость (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /news/categories/all

- **Описание**: Получить все категории новостей
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [NewsListQuery](API_CONTRACTS_DOCUMENTATION.md#newslistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[News](API_CONTRACTS_DOCUMENTATION.md#news)>

### POST /news/categories

- **Описание**: Создать категорию новостей (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Депутаты (/persons)

### GET /persons?districtId=1&convocationId=1&factionId=1

- **Описание**: Получить список депутатов
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### GET /persons/:id

- **Описание**: Получить депутата по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### POST /persons

- **Описание**: Создать депутата (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /persons/:id

- **Описание**: Обновить депутата (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### POST /persons/:id/media

- **Описание**: Загрузить фотографию депутата (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### POST /persons/:id/declarations

- **Описание**: Добавить декларацию депутата (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /persons/:id/declarations

- **Описание**: Получить декларации депутата
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### DELETE /persons/:id/declarations/:declarationId

- **Описание**: Удалить декларацию (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /persons/:id

- **Описание**: Удалить депутата (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /persons/categories/all

- **Описание**: Получить все категории депутатов
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### POST /persons/categories

- **Описание**: Создать категорию депутатов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /persons/factions/all

- **Описание**: Получить все фракции
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### POST /persons/factions

- **Описание**: Создать фракцию (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PUT /persons/factions/:id

- **Описание**: Обновить фракцию (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /persons/factions/:id

- **Описание**: Удалить фракцию (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /persons/districts/all

- **Описание**: Получить все округа
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### POST /persons/districts

- **Описание**: Создать округ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PUT /persons/districts/:id

- **Описание**: Обновить округ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /persons/districts/:id

- **Описание**: Удалить округ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /persons/convocations/all

- **Описание**: Получить все созывы
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [PersonListQuery](API_CONTRACTS_DOCUMENTATION.md#personlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Person](API_CONTRACTS_DOCUMENTATION.md#person)>

### POST /persons/convocations

- **Описание**: Создать созыв (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PUT /persons/convocations/:id

- **Описание**: Обновить созыв (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /persons/convocations/:id

- **Описание**: Удалить созыв (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Документы (/documents)

### GET /documents?query=

- **Описание**: Получить список документов
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [SearchDocumentQuery](API_CONTRACTS_DOCUMENTATION.md#searchdocumentquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Document](API_CONTRACTS_DOCUMENTATION.md#document)>

### GET /documents/:id

- **Описание**: Получить документ по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [SearchDocumentQuery](API_CONTRACTS_DOCUMENTATION.md#searchdocumentquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Document](API_CONTRACTS_DOCUMENTATION.md#document)>

### POST /documents

- **Описание**: Создать документ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [CreateDocumentRequest](API_CONTRACTS_DOCUMENTATION.md#createdocumentrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Document](API_CONTRACTS_DOCUMENTATION.md#document)>

### POST /documents/:id/pdf

- **Описание**: Загрузить PDF файл для документа (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /documents/:id

- **Описание**: Обновить документ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /documents/:id

- **Описание**: Удалить документ (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /documents/categories/all

- **Описание**: Получить все категории документов
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [SearchDocumentQuery](API_CONTRACTS_DOCUMENTATION.md#searchdocumentquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Document](API_CONTRACTS_DOCUMENTATION.md#document)>

### POST /documents/categories

- **Описание**: Создать категорию документов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /documents/categories/:id

- **Описание**: Обновить категорию документов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /documents/categories/:id

- **Описание**: Удалить категорию документов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Календарь событий (/calendar)

### GET /calendar?year=2024&month=1&dateFrom=1721049600000&dateTo=1723641600000&eventTypeId=1

- **Описание**: Получить список событий
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [EventListQuery](API_CONTRACTS_DOCUMENTATION.md#eventlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### GET /calendar/month/:year/:month

- **Описание**: Получить события за месяц
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [EventListQuery](API_CONTRACTS_DOCUMENTATION.md#eventlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### GET /calendar/year/:year

- **Описание**: Получить события за год
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [EventListQuery](API_CONTRACTS_DOCUMENTATION.md#eventlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### GET /calendar/:id

- **Описание**: Получить событие по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [EventListQuery](API_CONTRACTS_DOCUMENTATION.md#eventlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### POST /calendar

- **Описание**: Создать событие (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [CreateEventRequest](API_CONTRACTS_DOCUMENTATION.md#createeventrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### PATCH /calendar/:id

- **Описание**: Обновить событие (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /calendar/:id

- **Описание**: Удалить событие (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /calendar/types/all

- **Описание**: Получить все типы событий
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [EventListQuery](API_CONTRACTS_DOCUMENTATION.md#eventlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[CalendarEvent](API_CONTRACTS_DOCUMENTATION.md#calendarevent)>

### POST /calendar/types

- **Описание**: Создать тип события (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /calendar/types/:id

- **Описание**: Обновить тип события (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /calendar/types/:id

- **Описание**: Удалить тип события (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Обращения (/appeals)

### POST /appeals

- **Описание**: Создать обращение (требуется авторизация)
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [CreateAppealRequest](API_CONTRACTS_DOCUMENTATION.md#createappealrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Appeal](API_CONTRACTS_DOCUMENTATION.md#appeal)>

### GET /appeals?statusId=1&dateFrom=1721049600000&dateTo=1723641600000

- **Описание**: Получить список обращений
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [AppealListQuery](API_CONTRACTS_DOCUMENTATION.md#appeallistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Appeal](API_CONTRACTS_DOCUMENTATION.md#appeal)>

### GET /appeals/:id

- **Описание**: Получить обращение по ID
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [AppealListQuery](API_CONTRACTS_DOCUMENTATION.md#appeallistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Appeal](API_CONTRACTS_DOCUMENTATION.md#appeal)>

### GET /appeals/:id/history

- **Описание**: Получить историю изменений обращения
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [AppealListQuery](API_CONTRACTS_DOCUMENTATION.md#appeallistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Appeal](API_CONTRACTS_DOCUMENTATION.md#appeal)>

### PATCH /appeals/:id

- **Описание**: Обновить обращение (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /appeals/:id

- **Описание**: Удалить обращение (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /appeals/statuses/all

- **Описание**: Получить все статусы обращений
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [AppealListQuery](API_CONTRACTS_DOCUMENTATION.md#appeallistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Appeal](API_CONTRACTS_DOCUMENTATION.md#appeal)>

## Комментарии (/comments)

### POST /comments

- **Описание**: Создать комментарий (требуется авторизация)
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [CreateCommentRequest](API_CONTRACTS_DOCUMENTATION.md#createcommentrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Comment](API_CONTRACTS_DOCUMENTATION.md#comment)>

### GET /comments?entityType=news&entityId=1&onlyApproved=true&includeReplies=true

- **Описание**: Получить список комментариев
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [CommentListQuery](API_CONTRACTS_DOCUMENTATION.md#commentlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Comment](API_CONTRACTS_DOCUMENTATION.md#comment)>

### GET /comments/:id

- **Описание**: Получить комментарий по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [CommentListQuery](API_CONTRACTS_DOCUMENTATION.md#commentlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Comment](API_CONTRACTS_DOCUMENTATION.md#comment)>

### GET /comments/:id/replies

- **Описание**: Получить ответы на комментарий
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [CommentListQuery](API_CONTRACTS_DOCUMENTATION.md#commentlistquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[Comment](API_CONTRACTS_DOCUMENTATION.md#comment)>

### PATCH /comments/:id/approve

- **Описание**: Одобрить/отклонить комментарий (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /comments/:id

- **Описание**: Удалить комментарий (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Слайдер (/slider)

### GET /slider?all=false

- **Описание**: Получить список слайдов
- **Доступ**: public
- **Bearer**: no
- **Контракты**: response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[SliderItem](API_CONTRACTS_DOCUMENTATION.md#slideritem)>

### GET /slider/:id

- **Описание**: Получить слайд по ID
- **Доступ**: public
- **Bearer**: no
- **Контракты**: response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[SliderItem](API_CONTRACTS_DOCUMENTATION.md#slideritem)>

### POST /slider

- **Описание**: Создать слайд (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [CreateSliderItemRequest](API_CONTRACTS_DOCUMENTATION.md#createslideritemrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[SliderItem](API_CONTRACTS_DOCUMENTATION.md#slideritem)>

### POST /slider/:id/image

- **Описание**: Загрузить изображение для слайда (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /slider/:id

- **Описание**: Обновить слайд (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### POST /slider/reorder

- **Описание**: Изменить порядок слайдов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [ReorderSliderRequest](API_CONTRACTS_DOCUMENTATION.md#reordersliderrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<`any`>

### DELETE /slider/:id

- **Описание**: Удалить слайд (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Поиск (/search)

### GET /search?query=

- **Описание**: Поиск по сайту
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [SearchQuery](API_CONTRACTS_DOCUMENTATION.md#searchquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<`any`>

## О сайте (/about)

### GET /about/pages?locale=ru

- **Описание**: Получить все страницы
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [AboutPageQuery](API_CONTRACTS_DOCUMENTATION.md#aboutpagequery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[AboutPage](API_CONTRACTS_DOCUMENTATION.md#aboutpage)>

### GET /about/pages/:slug?locale=ru

- **Описание**: Получить страницу по slug
- **Доступ**: public
- **Bearer**: no
- **Контракты**: request: [AboutPageQuery](API_CONTRACTS_DOCUMENTATION.md#aboutpagequery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[AboutPage](API_CONTRACTS_DOCUMENTATION.md#aboutpage)>

### POST /about/pages

- **Описание**: Создать страницу (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /about/pages/:id

- **Описание**: Обновить страницу (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /about/pages/:id

- **Описание**: Удалить страницу (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### GET /about/structure

- **Описание**: Получить структуру органов управления
- **Доступ**: public
- **Bearer**: no

### POST /about/structure

- **Описание**: Создать элемент структуры (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### PATCH /about/structure/:id

- **Описание**: Обновить элемент структуры (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

### DELETE /about/structure/:id

- **Описание**: Удалить элемент структуры (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes

## Доступность (/accessibility)

### GET /accessibility/settings?sessionId=session-uuid

- **Описание**: Получить настройки доступности
- **Доступ**: auth
- **Bearer**: yes
- **Контракты**: request: [AccessibilitySettingsQuery](API_CONTRACTS_DOCUMENTATION.md#accessibilitysettingsquery) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[AccessibilitySettings](API_CONTRACTS_DOCUMENTATION.md#accessibilitysettings)>

### POST /accessibility/settings

- **Описание**: Сохранить настройки доступности
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [SaveAccessibilitySettingsRequest](API_CONTRACTS_DOCUMENTATION.md#saveaccessibilitysettingsrequest) • response: [ApiResponse](API_CONTRACTS_DOCUMENTATION.md#apiresponse)<[AccessibilitySettings](API_CONTRACTS_DOCUMENTATION.md#accessibilitysettings)>

## Переводы (/translation)

### POST /translation/translate

- **Описание**: Перевести текст (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [TranslateRequest](API_CONTRACTS_DOCUMENTATION.md#translaterequest) • response: [TranslateResponse](API_CONTRACTS_DOCUMENTATION.md#translateresponse)

### POST /translation/translate-batch

- **Описание**: Перевести массив текстов (только для администраторов)
- **Доступ**: admin
- **Bearer**: yes
- **Контракты**: request: [TranslateBatchRequest](API_CONTRACTS_DOCUMENTATION.md#translatebatchrequest) • response: [TranslateBatchResponse](API_CONTRACTS_DOCUMENTATION.md#translatebatchresponse)

## Файлы (/files)

### GET /files/:id

- **Описание**: Получить файл по ID (deprecated)
- **Доступ**: public
- **Bearer**: no

### GET /files/v2/:id

- **Описание**: Получить файл по ID (v2)
- **Доступ**: admin
- **Bearer**: yes

## Резервное копирование (/backup)

### POST /backup

- **Описание**: Создать резервную копию БД
- **Доступ**: auth
- **Bearer**: yes

### GET /backup

- **Описание**: Получить список всех бэкапов
- **Доступ**: auth
- **Bearer**: yes

### POST /backup/:id/restore

- **Описание**: Восстановить БД из бэкапа
- **Доступ**: auth
- **Bearer**: yes

### DELETE /backup/:id

- **Описание**: Удалить бэкап
- **Доступ**: admin
- **Bearer**: yes

## Экспорт в социальные сети (/social-export)

### POST /social-export/news/:id/vk

- **Описание**: Экспортировать новость в ВКонтакте
- **Доступ**: auth
- **Bearer**: yes

### POST /social-export/news/:id/telegram

- **Описание**: Экспортировать новость в Telegram
- **Доступ**: auth
- **Bearer**: yes

### POST /social-export/news/:id/all

- **Описание**: Экспортировать новость во все соцсети
- **Доступ**: auth
- **Bearer**: yes

### GET /social-export/news/:id/history

- **Описание**: Получить историю экспорта новости
- **Доступ**: admin
- **Bearer**: yes

## ЕСИА (Единая система идентификации и аутентификации) (/esia)

### GET /esia/auth?code=

- **Описание**: Авторизация через ЕСИА
- **Доступ**: public
- **Bearer**: no

### GET /esia/callback

- **Описание**: Callback от ЕСИА
- **Доступ**: admin
- **Bearer**: yes

---
Generated at: 2025-12-18T14:11:05.092Z
