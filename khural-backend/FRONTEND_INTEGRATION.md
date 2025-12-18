# Руководство по интеграции фронтенда с бэкендом

## Быстрый старт

### 1. Базовый URL

```typescript
const API_BASE_URL = 'http://localhost:4000'; // или ваш production URL
```

### 2. Настройка HTTP клиента

#### Пример с fetch API:

```typescript
class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<void> {
    await this.request<T>(endpoint, { method: 'DELETE' });
  }

  async uploadFile<T>(
    endpoint: string,
    file: File,
    fieldName: string = 'file'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }
}

// Использование
const api = new ApiClient('http://localhost:4000');
```

#### Пример с axios:

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Добавляем токен к каждому запросу
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Обработка ошибок
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Попытка обновить токен
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const { data } = await axios.post(`${baseURL}/auth/refresh`, {
                refresh: refreshToken,
              });
              localStorage.setItem('access_token', data.data.access_token);
              localStorage.setItem('refresh_token', data.data.refresh_token);
              // Повторяем запрос
              error.config.headers.Authorization = `Bearer ${data.data.access_token}`;
              return this.client.request(error.config);
            } catch (refreshError) {
              // Редирект на страницу входа
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    await this.client.delete<T>(url, config);
  }

  async uploadFile<T>(
    url: string,
    file: File,
    fieldName: string = 'file'
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }
}

const api = new ApiClient('http://localhost:4000');
```

---

## Аутентификация

### 1. Вход в систему

```typescript
// Вход по email и паролю
const login = async (email: string, password: string) => {
  const response = await api.post<UserCredentials>('/auth/login/password', {
    email,
    password,
  });

  const credentials = response.data;
  
  // Сохраняем токены
  localStorage.setItem('access_token', credentials.access_token);
  localStorage.setItem('refresh_token', credentials.refresh_token);
  
  // Устанавливаем токен для последующих запросов
  api.setAccessToken(credentials.access_token);
  
  return credentials;
};

// Вход по телефону
const loginByPhone = async (phone: string) => {
  const response = await api.post<UserCredentials>('/auth/login', {
    phone,
  });

  const credentials = response.data;
  localStorage.setItem('access_token', credentials.access_token);
  localStorage.setItem('refresh_token', credentials.refresh_token);
  api.setAccessToken(credentials.access_token);
  
  return credentials;
};
```

### 2. Обновление токена

```typescript
const refreshToken = async (): Promise<UserCredentials | null> => {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await api.post<UserCredentials>('/auth/refresh', {
      refresh: refreshToken,
    });

    const credentials = response.data;
    localStorage.setItem('access_token', credentials.access_token);
    localStorage.setItem('refresh_token', credentials.refresh_token);
    api.setAccessToken(credentials.access_token);
    
    return credentials;
  } catch (error) {
    // Токен истек, требуется повторный вход
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    return null;
  }
};
```

### 3. Выход из системы

```typescript
const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  api.setAccessToken('');
  window.location.href = '/login';
};
```

---

## Работа с данными

### Примеры запросов

#### Получение списка новостей

```typescript
const getNews = async (filters?: NewsListQuery) => {
  const params = new URLSearchParams();
  if (filters?.categoryId) {
    params.append('categoryId', filters.categoryId.toString());
  }
  if (filters?.year) {
    params.append('year', filters.year.toString());
  }

  const queryString = params.toString();
  const endpoint = `/news${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get<News[]>(endpoint);
  return response.data;
};
```

#### Создание новости

```typescript
const createNews = async (newsData: CreateNewsRequest) => {
  const response = await api.post<News>('/news', newsData);
  return response.data;
};
```

#### Загрузка файла

```typescript
const uploadNewsCover = async (newsId: number, file: File) => {
  const formData = new FormData();
  formData.append('cover', file);

  const response = await fetch(`${API_BASE_URL}/news/${newsId}/cover`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.data;
};
```

#### Поиск документов

```typescript
const searchDocuments = async (query: string, filters?: SearchDocumentQuery) => {
  const params = new URLSearchParams();
  params.append('query', query);
  
  if (filters?.type) {
    params.append('type', filters.type);
  }
  if (filters?.year) {
    params.append('year', filters.year.toString());
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }

  const response = await api.get<Document[]>(`/documents?${params.toString()}`);
  return {
    documents: response.data,
    pagination: response.meta?.pagination,
  };
};
```

---

## Обработка ошибок

### Универсальный обработчик ошибок

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    // Сервер вернул ответ с кодом ошибки
    const status = error.response.status;
    const message = error.response.data?.message || 'Произошла ошибка';

    switch (status) {
      case 401:
        // Неавторизован - попробовать обновить токен
        refreshToken();
        break;
      case 403:
        // Нет доступа
        alert('У вас нет доступа к этому ресурсу');
        break;
      case 404:
        // Не найдено
        alert('Ресурс не найден');
        break;
      case 500:
        // Ошибка сервера
        alert('Ошибка сервера. Попробуйте позже');
        break;
      default:
        alert(message);
    }
  } else if (error.request) {
    // Запрос был отправлен, но ответа не получено
    alert('Нет соединения с сервером');
  } else {
    // Ошибка при настройке запроса
    alert('Ошибка при отправке запроса');
  }
};
```

---

## React Hook примеры

### Хук для работы с новостями

```typescript
import { useState, useEffect } from 'react';
import { News, NewsListQuery, CreateNewsRequest } from './types';

export const useNews = (filters?: NewsListQuery) => {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getNews(filters);
        setNews(data);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [filters?.categoryId, filters?.year]);

  const createNews = async (newsData: CreateNewsRequest) => {
    try {
      const newNews = await createNews(newsData);
      setNews((prev) => [newNews, ...prev]);
      return newNews;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { news, loading, error, createNews };
};
```

### Хук для аутентификации

```typescript
import { useState, useEffect } from 'react';
import { User, UserCredentials } from './types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          api.setAccessToken(token);
          const response = await api.get<User>('/user/me');
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // Токен невалиден
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const credentials = await login(email, password);
      const response = await api.get<User>('/user/me');
      setUser(response.data);
      setIsAuthenticated(true);
      return credentials;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, loading, isAuthenticated, login, logout };
};
```

---

## Работа с файлами

### Загрузка изображения

```typescript
const uploadImage = async (file: File, endpoint: string, fieldName: string = 'image') => {
  const formData = new FormData();
  formData.append(fieldName, file);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Ошибка загрузки файла');
  }

  const result = await response.json();
  return result.data;
};

// Использование
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const uploadedFile = await uploadImage(file, '/news/1/cover', 'cover');
    console.log('Файл загружен:', uploadedFile);
  } catch (error) {
    console.error('Ошибка загрузки:', error);
  }
};
```

### Получение ссылки на файл

```typescript
const getFileUrl = (fileId: string): string => {
  return `${API_BASE_URL}/files/v2/${fileId}`;
};

// Или используйте поле link из ответа API
const imageUrl = news.coverImage?.link;
```

---

## Пагинация

### Компонент пагинации

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  return (
    <div className="pagination">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Назад
      </button>
      <span>
        Страница {currentPage} из {totalPages}
      </span>
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Вперед
      </button>
    </div>
  );
};
```

---

## Рекомендации

1. **Кэширование**: Используйте React Query или SWR для кэширования данных
2. **Обработка токенов**: Реализуйте автоматическое обновление токенов
3. **Валидация**: Используйте библиотеки типа Zod или Yup для валидации данных
4. **Типизация**: Используйте TypeScript и типы из `API_CONTRACTS.ts`
5. **Обработка ошибок**: Создайте централизованную систему обработки ошибок
6. **Загрузка файлов**: Показывайте прогресс загрузки для больших файлов
7. **Оптимистичные обновления**: Обновляйте UI до получения ответа от сервера

---

## Полезные ссылки

- Полная документация API: `API_DOCUMENTATION.md`
- TypeScript контракты: `API_CONTRACTS.ts`
- Swagger UI: `http://localhost:4000/api` (при запущенном сервере)
