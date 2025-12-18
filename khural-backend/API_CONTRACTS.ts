/**
 * TypeScript контракты API для фронтенд-разработчика
 * 
 * Этот файл содержит типы и интерфейсы для всех эндпоинтов API.
 * Используйте эти типы для типизации запросов и ответов в вашем фронтенд-приложении.
 */

// ============================================================================
// Базовые типы
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      offset: number;
      limit: number;
      total: number;
      page: number;
      pages: number;
      isHidden?: boolean;
    };
  };
}

export enum UserRole {
  ADMIN = 'admin',
  CITIZEN = 'citizen',
}

export enum Locale {
  RU = 'ru',
  TY = 'ty', // Тувинский
}

export enum DocumentType {
  LAW = 'law',
  RESOLUTION = 'resolution',
  DECISION = 'decision',
  ORDER = 'order',
  OTHER = 'other',
}

export enum CommentEntityType {
  NEWS = 'news',
  DOCUMENT = 'document',
}

export enum DeclarationType {
  INCOME = 'income',
  ASSETS = 'assets',
}

export enum SearchContentType {
  ALL = 'all',
  NEWS = 'news',
  DOCUMENTS = 'documents',
  PERSONS = 'persons',
}

// ============================================================================
// Авторизация
// ============================================================================

export interface UserCredentials {
  access_token: string;
  expires: number;
  refresh_token: string;
  refresh_expire_date: number;
  user: string;
}

export interface LoginByPhoneRequest {
  phone: string;
}

export interface LoginByEmailRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdatePasswordRequest {
  email: string;
  password: string;
}

// ============================================================================
// Пользователи
// ============================================================================

export interface User {
  id: string;
  surname?: string;
  name?: string;
  patronymic?: string;
  phone: string;
  email?: string;
  role: {
    id: UserRole;
    admin_access: boolean;
    app_access: boolean;
  };
  avatar?: FileInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRequest {
  surname?: string;
  name?: string;
  phone: string;
  email?: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  surname?: string;
  name?: string;
  patronymic?: string;
  phone?: string;
  email?: string;
}

export interface UserSearchQuery {
  many?: boolean;
  phone?: string;
  email?: string;
  id?: string;
}

// ============================================================================
// Новости
// ============================================================================

export interface NewsCategory {
  id: number;
  name: string;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  shortDescription?: string;
  content: string;
  category: NewsCategory;
  coverImage?: FileInfo;
  gallery?: FileInfo[];
  publishedAt: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewsRequest {
  title: string;
  slug?: string;
  shortDescription?: string;
  content: string;
  categoryId: number;
  publishedAt?: number;
  coverImageId?: string;
  galleryIds?: string[];
  isPublished?: boolean;
}

export interface NewsListQuery {
  categoryId?: number;
  year?: number;
}

// ============================================================================
// Депутаты
// ============================================================================

export interface District {
  id: number;
  name: string;
}

export interface Faction {
  id: number;
  name: string;
}

export interface Convocation {
  id: number;
  name: string;
}

export interface PersonCategory {
  id: number;
  name: string;
}

export interface ReceptionSchedule {
  dayOfWeek?: string;
  time?: string;
  location?: string;
  notes?: string;
}

export interface Person {
  id: number;
  fullName: string;
  districts?: District[];
  city?: string;
  electoralDistrict?: string;
  factions?: Faction[];
  committee?: string;
  description?: string;
  education?: string;
  workExperience?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: number;
  placeOfBirth?: string;
  startDate?: number;
  convocations?: Convocation[];
  receptionSchedule?: ReceptionSchedule;
  categories?: PersonCategory[];
  image?: FileInfo;
}

export interface CreatePersonRequest {
  fullName: string;
  districtIds?: number[];
  city?: string;
  electoralDistrict?: string;
  factionIds?: number[];
  committee?: string;
  description?: string;
  education?: string;
  workExperience?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: number;
  placeOfBirth?: string;
  startDate?: number;
  convocationIds?: number[];
  receptionSchedule?: ReceptionSchedule;
  categoryIds?: number[];
}

export interface PersonListQuery {
  districtId?: number;
  convocationId?: number;
  factionId?: number;
}

export interface Declaration {
  id: number;
  type: DeclarationType;
  year?: string;
  description?: string;
  pdfFile: FileInfo;
  createdAt: string;
}

export interface CreateDeclarationRequest {
  pdf: File;
  type: DeclarationType;
  year?: string;
  description?: string;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface CreateFactionRequest {
  name: string;
}

export interface CreateDistrictRequest {
  name: string;
}

export interface CreateConvocationRequest {
  name: string;
}

// ============================================================================
// Документы
// ============================================================================

export interface DocumentCategory {
  id: number;
  name: string;
  parentId?: number;
  order?: number;
}

export interface Document {
  id: number;
  title: string;
  number?: string;
  type: DocumentType;
  content?: string;
  category?: DocumentCategory;
  pdfFile?: FileInfo;
  metadata?: {
    author?: string;
    department?: string;
    keywords?: string[];
    [key: string]: any;
  };
  publishedAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  number?: string;
  type: DocumentType;
  content?: string;
  categoryId?: number;
  pdfFileId?: string;
  metadata?: {
    author?: string;
    department?: string;
    keywords?: string[];
    [key: string]: any;
  };
  publishedAt?: number;
  isPublished?: boolean;
}

export interface SearchDocumentQuery {
  query?: string;
  categoryId?: number;
  type?: DocumentType;
  year?: number;
  page?: number;
  limit?: number;
}

export interface CreateDocumentCategoryRequest {
  name: string;
  parentId?: number;
  order?: number;
}

export interface UpdateDocumentCategoryRequest {
  name?: string;
  parentId?: number;
  order?: number;
}

// ============================================================================
// Календарь
// ============================================================================

export interface EventType {
  id: number;
  name: string;
  color?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  eventType?: EventType;
  participants?: Person[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  startDate: number;
  endDate?: number;
  location?: string;
  eventTypeId?: number;
  participantIds?: number[];
  isPublic?: boolean;
}

export interface EventListQuery {
  year?: number;
  month?: number;
  dateFrom?: number;
  dateTo?: number;
  eventTypeId?: number;
}

export interface CreateEventTypeRequest {
  name: string;
  color?: string;
}

export interface UpdateEventTypeRequest {
  name?: string;
  color?: string;
}

// ============================================================================
// Обращения
// ============================================================================

export interface AppealStatus {
  id: number;
  name: string;
}

export interface Appeal {
  id: number;
  subject: string;
  message: string;
  status: AppealStatus;
  user: {
    id: string;
    name?: string;
  };
  attachments?: FileInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppealRequest {
  subject: string;
  message: string;
  attachmentIds?: string[];
}

export interface UpdateAppealRequest {
  statusId?: number;
  comment?: string;
}

export interface AppealListQuery {
  statusId?: number;
  dateFrom?: number;
  dateTo?: number;
}

export interface AppealHistoryItem {
  id: number;
  status: AppealStatus;
  comment?: string;
  changedBy: {
    id: string;
    name?: string;
  };
  createdAt: string;
}

// ============================================================================
// Комментарии
// ============================================================================

export interface Comment {
  id: number;
  content: string;
  user: {
    id: string;
    name?: string;
  };
  parentComment?: Comment;
  replies?: Comment[];
  entityType: CommentEntityType;
  entityId: number;
  isApproved: boolean;
  isModerated: boolean;
  moderator?: {
    id: string;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: number;
  entityType: CommentEntityType;
  entityId: number;
}

export interface CommentListQuery {
  entityType: CommentEntityType;
  entityId: number;
  onlyApproved?: boolean;
  includeReplies?: boolean;
}

export interface ApproveCommentRequest {
  approved: boolean;
}

// ============================================================================
// Слайдер
// ============================================================================

export interface SliderItem {
  id: number;
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  image?: FileInfo;
  order: number;
  isActive: boolean;
  autoRotateInterval?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSliderItemRequest {
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  imageId?: string;
  order?: number;
  isActive?: boolean;
  autoRotateInterval?: number;
}

export interface ReorderSliderRequest {
  ids: number[];
}

// ============================================================================
// Поиск
// ============================================================================

export interface SearchQuery {
  query: string;
  contentType?: SearchContentType;
  contentTypes?: SearchContentType[];
  page?: number;
  limit?: number;
}

export interface SearchResults {
  news?: News[];
  documents?: Document[];
  persons?: Person[];
}

// ============================================================================
// О сайте
// ============================================================================

export interface AboutPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  locale: Locale;
}

export interface CreateAboutPageRequest {
  slug: string;
  title: string;
  content: string;
  locale: Locale;
}

export interface AboutPageQuery {
  locale?: Locale;
}

export interface StructureItem {
  id: number;
  title: string;
  description?: string;
  order?: number;
}

export interface CreateStructureItemRequest {
  title: string;
  description?: string;
  order?: number;
}

// ============================================================================
// Доступность
// ============================================================================

export interface AccessibilitySettings {
  fontSize?: number;
  colorScheme?: string;
  contrast?: string;
  disableAnimations?: boolean;
}

export interface SaveAccessibilitySettingsRequest {
  sessionId?: string;
  fontSize?: number;
  colorScheme?: string;
  contrast?: string;
  disableAnimations?: boolean;
}

export interface AccessibilitySettingsQuery {
  sessionId?: string;
}

// ============================================================================
// Переводы
// ============================================================================

export interface TranslateRequest {
  text: string;
  from: Locale;
  to: Locale;
}

export interface TranslateResponse {
  original: string;
  translated: string;
  from: Locale;
  to: Locale;
}

export interface TranslateBatchRequest {
  texts: string[];
  from: Locale;
  to: Locale;
}

export interface TranslateBatchResponse {
  originals: string[];
  translated: string[];
  from: Locale;
  to: Locale;
}

// ============================================================================
// Файлы
// ============================================================================

export interface FileInfo {
  id: string;
  link: string;
  filename_disk?: string;
}

// ============================================================================
// Резервное копирование
// ============================================================================

export interface Backup {
  id: number;
  filename: string;
  createdAt: string;
  size: number;
}

export interface RestoreBackupResponse {
  success: boolean;
}

// ============================================================================
// Экспорт в социальные сети
// ============================================================================

export interface SocialExportResult {
  success: boolean;
  postId?: string;
  messageId?: number;
  platform: 'vk' | 'telegram';
}

export interface SocialExportAllResult {
  vk?: SocialExportResult;
  telegram?: SocialExportResult;
}

export interface SocialExportHistoryItem {
  id: number;
  platform: 'vk' | 'telegram';
  postId?: string;
  messageId?: number;
  exportedAt: string;
  status: 'success' | 'error';
}

// ============================================================================
// ЕСИА
// ============================================================================

export interface EsiaAuthQuery {
  code?: string;
  state?: string;
}

export interface EsiaAuthResponse {
  message: string;
  code?: string;
  state?: string;
}

// ============================================================================
// Примеры использования типов
// ============================================================================

/*
// Пример использования в запросе:
const createNews = async (data: CreateNewsRequest): Promise<ApiResponse<News>> => {
  const response = await fetch('/news', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Пример использования в компоненте:
const NewsList: React.FC = () => {
  const [news, setNews] = useState<News[]>([]);
  
  useEffect(() => {
    fetch('/news')
      .then(res => res.json())
      .then((response: ApiResponse<News[]>) => {
        setNews(response.data);
      });
  }, []);
  
  return (
    <div>
      {news.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
};
*/
