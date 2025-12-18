# API_CONTRACTS.ts — документация всех полей

Источник: `API_CONTRACTS.ts`

Содержимое: **Enums**, **Interfaces**, **Type aliases**.

## Enums

### CommentEntityType

| Key | Value |
|---|---|
| NEWS | news |
| DOCUMENT | document |

### DeclarationType

| Key | Value |
|---|---|
| INCOME | income |
| ASSETS | assets |

### DocumentType

| Key | Value |
|---|---|
| LAW | law |
| RESOLUTION | resolution |
| DECISION | decision |
| ORDER | order |
| OTHER | other |

### Locale

| Key | Value |
|---|---|
| RU | ru |
| TY | ty |

### SearchContentType

| Key | Value |
|---|---|
| ALL | all |
| NEWS | news |
| DOCUMENTS | documents |
| PERSONS | persons |

### UserRole

| Key | Value |
|---|---|
| ADMIN | admin |
| CITIZEN | citizen |

## Interfaces

### AboutPage

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| slug | string | yes |  |
| title | string | yes |  |
| content | string | yes |  |
| locale | Locale | yes |  |

### AboutPageQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| locale | Locale | no |  |

### AccessibilitySettings

| Field | Type | Required | Description |
|---|---|---:|---|
| fontSize | number | no |  |
| colorScheme | string | no |  |
| contrast | string | no |  |
| disableAnimations | boolean | no |  |

### AccessibilitySettingsQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| sessionId | string | no |  |

### ApiResponse

TypeScript контракты API для фронтенд-разработчика

Этот файл содержит типы и интерфейсы для всех эндпоинтов API.
Используйте эти типы для типизации запросов и ответов в вашем фронтенд-приложении.

| Field | Type | Required | Description |
|---|---|---:|---|
| data | T | yes |  |
| meta | { pagination?: { offset: number; limit: number; total: number; page: number; pages: number; isHidden?: boolean; }; } | no |  |

### Appeal

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| subject | string | yes |  |
| message | string | yes |  |
| status | AppealStatus | yes |  |
| user | { id: string; name?: string; } | yes |  |
| attachments | FileInfo[] | no |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### AppealHistoryItem

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| status | AppealStatus | yes |  |
| comment | string | no |  |
| changedBy | { id: string; name?: string; } | yes |  |
| createdAt | string | yes |  |

### AppealListQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| statusId | number | no |  |
| dateFrom | number | no |  |
| dateTo | number | no |  |

### AppealStatus

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### ApproveCommentRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| approved | boolean | yes |  |

### Backup

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| filename | string | yes |  |
| createdAt | string | yes |  |
| size | number | yes |  |

### CalendarEvent

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| title | string | yes |  |
| description | string | no |  |
| startDate | string | yes |  |
| endDate | string | no |  |
| location | string | no |  |
| eventType | EventType | no |  |
| participants | Person[] | no |  |
| isPublic | boolean | yes |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### Comment

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| content | string | yes |  |
| user | { id: string; name?: string; } | yes |  |
| parentComment | Comment | no |  |
| replies | Comment[] | no |  |
| entityType | CommentEntityType | yes |  |
| entityId | number | yes |  |
| isApproved | boolean | yes |  |
| isModerated | boolean | yes |  |
| moderator | { id: string; name?: string; } | no |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### CommentListQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| entityType | CommentEntityType | yes |  |
| entityId | number | yes |  |
| onlyApproved | boolean | no |  |
| includeReplies | boolean | no |  |

### Convocation

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### CreateAboutPageRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| slug | string | yes |  |
| title | string | yes |  |
| content | string | yes |  |
| locale | Locale | yes |  |

### CreateAppealRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| subject | string | yes |  |
| message | string | yes |  |
| attachmentIds | string[] | no |  |

### CreateCategoryRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |

### CreateCommentRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| content | string | yes |  |
| parentCommentId | number | no |  |
| entityType | CommentEntityType | yes |  |
| entityId | number | yes |  |

### CreateConvocationRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |

### CreateDeclarationRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| pdf | File | yes |  |
| type | DeclarationType | yes |  |
| year | string | no |  |
| description | string | no |  |

### CreateDistrictRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |

### CreateDocumentCategoryRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |
| parentId | number | no |  |
| order | number | no |  |

### CreateDocumentRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| title | string | yes |  |
| number | string | no |  |
| type | DocumentType | yes |  |
| content | string | no |  |
| categoryId | number | no |  |
| pdfFileId | string | no |  |
| metadata | { author?: string; department?: string; keywords?: string[]; [key: string]: any; } | no |  |
| publishedAt | number | no |  |
| isPublished | boolean | no |  |

### CreateEventRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| title | string | yes |  |
| description | string | no |  |
| startDate | number | yes |  |
| endDate | number | no |  |
| location | string | no |  |
| eventTypeId | number | no |  |
| participantIds | number[] | no |  |
| isPublic | boolean | no |  |

### CreateEventTypeRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |
| color | string | no |  |

### CreateFactionRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | yes |  |

### CreateNewsRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| title | string | yes |  |
| slug | string | no |  |
| shortDescription | string | no |  |
| content | string | yes |  |
| categoryId | number | yes |  |
| publishedAt | number | no |  |
| coverImageId | string | no |  |
| galleryIds | string[] | no |  |
| isPublished | boolean | no |  |

### CreatePersonRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| fullName | string | yes |  |
| districtIds | number[] | no |  |
| city | string | no |  |
| electoralDistrict | string | no |  |
| factionIds | number[] | no |  |
| committee | string | no |  |
| description | string | no |  |
| education | string | no |  |
| workExperience | string | no |  |
| email | string | no |  |
| phoneNumber | string | no |  |
| dateOfBirth | number | no |  |
| placeOfBirth | string | no |  |
| startDate | number | no |  |
| convocationIds | number[] | no |  |
| receptionSchedule | ReceptionSchedule | no |  |
| categoryIds | number[] | no |  |

### CreateSliderItemRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| title | string | yes |  |
| description | string | no |  |
| buttonText | string | no |  |
| buttonLink | string | no |  |
| imageId | string | no |  |
| order | number | no |  |
| isActive | boolean | no |  |
| autoRotateInterval | number | no |  |

### CreateStructureItemRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| title | string | yes |  |
| description | string | no |  |
| order | number | no |  |

### CreateUserRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| surname | string | no |  |
| name | string | no |  |
| phone | string | yes |  |
| email | string | no |  |
| password | string | yes |  |
| role | UserRole | no |  |

### Declaration

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| type | DeclarationType | yes |  |
| year | string | no |  |
| description | string | no |  |
| pdfFile | FileInfo | yes |  |
| createdAt | string | yes |  |

### District

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### Document

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| title | string | yes |  |
| number | string | no |  |
| type | DocumentType | yes |  |
| content | string | no |  |
| category | DocumentCategory | no |  |
| pdfFile | FileInfo | no |  |
| metadata | { author?: string; department?: string; keywords?: string[]; [key: string]: any; } | no |  |
| publishedAt | string | no |  |
| isPublished | boolean | yes |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### DocumentCategory

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |
| parentId | number | no |  |
| order | number | no |  |

### EsiaAuthQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| code | string | no |  |
| state | string | no |  |

### EsiaAuthResponse

| Field | Type | Required | Description |
|---|---|---:|---|
| message | string | yes |  |
| code | string | no |  |
| state | string | no |  |

### EventListQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| year | number | no |  |
| month | number | no |  |
| dateFrom | number | no |  |
| dateTo | number | no |  |
| eventTypeId | number | no |  |

### EventType

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |
| color | string | no |  |

### Faction

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### FileInfo

| Field | Type | Required | Description |
|---|---|---:|---|
| id | string | yes |  |
| link | string | yes |  |
| filename_disk | string | no |  |

### LoginByEmailRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| email | string | yes |  |
| password | string | yes |  |

### LoginByPhoneRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| phone | string | yes |  |

### News

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| title | string | yes |  |
| slug | string | yes |  |
| shortDescription | string | no |  |
| content | string | yes |  |
| category | NewsCategory | yes |  |
| coverImage | FileInfo | no |  |
| gallery | FileInfo[] | no |  |
| publishedAt | string | yes |  |
| isPublished | boolean | yes |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### NewsCategory

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### NewsListQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| categoryId | number | no |  |
| year | number | no |  |

### Person

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| fullName | string | yes |  |
| districts | District[] | no |  |
| city | string | no |  |
| electoralDistrict | string | no |  |
| factions | Faction[] | no |  |
| committee | string | no |  |
| description | string | no |  |
| education | string | no |  |
| workExperience | string | no |  |
| email | string | no |  |
| phoneNumber | string | no |  |
| dateOfBirth | number | no |  |
| placeOfBirth | string | no |  |
| startDate | number | no |  |
| convocations | Convocation[] | no |  |
| receptionSchedule | ReceptionSchedule | no |  |
| categories | PersonCategory[] | no |  |
| image | FileInfo | no |  |

### PersonCategory

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| name | string | yes |  |

### PersonListQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| districtId | number | no |  |
| convocationId | number | no |  |
| factionId | number | no |  |

### ReceptionSchedule

| Field | Type | Required | Description |
|---|---|---:|---|
| dayOfWeek | string | no |  |
| time | string | no |  |
| location | string | no |  |
| notes | string | no |  |

### RefreshTokenRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| refresh | string | yes |  |

### ReorderSliderRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| ids | number[] | yes |  |

### ResetPasswordRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| email | string | yes |  |

### RestoreBackupResponse

| Field | Type | Required | Description |
|---|---|---:|---|
| success | boolean | yes |  |

### SaveAccessibilitySettingsRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| sessionId | string | no |  |
| fontSize | number | no |  |
| colorScheme | string | no |  |
| contrast | string | no |  |
| disableAnimations | boolean | no |  |

### SearchDocumentQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| query | string | no |  |
| categoryId | number | no |  |
| type | DocumentType | no |  |
| year | number | no |  |
| page | number | no |  |
| limit | number | no |  |

### SearchQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| query | string | yes |  |
| contentType | SearchContentType | no |  |
| contentTypes | SearchContentType[] | no |  |
| page | number | no |  |
| limit | number | no |  |

### SearchResults

| Field | Type | Required | Description |
|---|---|---:|---|
| news | News[] | no |  |
| documents | Document[] | no |  |
| persons | Person[] | no |  |

### SliderItem

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| title | string | yes |  |
| description | string | no |  |
| buttonText | string | no |  |
| buttonLink | string | no |  |
| image | FileInfo | no |  |
| order | number | yes |  |
| isActive | boolean | yes |  |
| autoRotateInterval | number | no |  |
| createdAt | string | yes |  |
| updatedAt | string | yes |  |

### SocialExportAllResult

| Field | Type | Required | Description |
|---|---|---:|---|
| vk | SocialExportResult | no |  |
| telegram | SocialExportResult | no |  |

### SocialExportHistoryItem

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| platform | 'vk' \| 'telegram' | yes |  |
| postId | string | no |  |
| messageId | number | no |  |
| exportedAt | string | yes |  |
| status | 'success' \| 'error' | yes |  |

### SocialExportResult

| Field | Type | Required | Description |
|---|---|---:|---|
| success | boolean | yes |  |
| postId | string | no |  |
| messageId | number | no |  |
| platform | 'vk' \| 'telegram' | yes |  |

### StructureItem

| Field | Type | Required | Description |
|---|---|---:|---|
| id | number | yes |  |
| title | string | yes |  |
| description | string | no |  |
| order | number | no |  |

### TranslateBatchRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| texts | string[] | yes |  |
| from | Locale | yes |  |
| to | Locale | yes |  |

### TranslateBatchResponse

| Field | Type | Required | Description |
|---|---|---:|---|
| originals | string[] | yes |  |
| translated | string[] | yes |  |
| from | Locale | yes |  |
| to | Locale | yes |  |

### TranslateRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| text | string | yes |  |
| from | Locale | yes |  |
| to | Locale | yes |  |

### TranslateResponse

| Field | Type | Required | Description |
|---|---|---:|---|
| original | string | yes |  |
| translated | string | yes |  |
| from | Locale | yes |  |
| to | Locale | yes |  |

### UpdateAppealRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| statusId | number | no |  |
| comment | string | no |  |

### UpdateDocumentCategoryRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | no |  |
| parentId | number | no |  |
| order | number | no |  |

### UpdateEventTypeRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| name | string | no |  |
| color | string | no |  |

### UpdatePasswordRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| email | string | yes |  |
| password | string | yes |  |

### UpdateUserRequest

| Field | Type | Required | Description |
|---|---|---:|---|
| surname | string | no |  |
| name | string | no |  |
| patronymic | string | no |  |
| phone | string | no |  |
| email | string | no |  |

### User

| Field | Type | Required | Description |
|---|---|---:|---|
| id | string | yes |  |
| surname | string | no |  |
| name | string | no |  |
| patronymic | string | no |  |
| phone | string | yes |  |
| email | string | no |  |
| role | { id: UserRole; admin_access: boolean; app_access: boolean; } | yes |  |
| avatar | FileInfo | no |  |
| createdAt | string | no |  |
| updatedAt | string | no |  |

### UserCredentials

| Field | Type | Required | Description |
|---|---|---:|---|
| access_token | string | yes |  |
| expires | number | yes |  |
| refresh_token | string | yes |  |
| refresh_expire_date | number | yes |  |
| user | string | yes |  |

### UserSearchQuery

| Field | Type | Required | Description |
|---|---|---:|---|
| many | boolean | no |  |
| phone | string | no |  |
| email | string | no |  |
| id | string | no |  |

## Type aliases

---
Generated at: 2025-12-18T14:06:44.151Z
