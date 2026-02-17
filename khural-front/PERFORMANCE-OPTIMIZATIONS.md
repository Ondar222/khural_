# Оптимизация производительности

Этот документ описывает внесённые оптимизации производительности для решения проблемы зависаний сайта на слабых устройствах.

## Проблемы, которые были решены

### 1. Зависания при прокрутке и взаимодействии
**Проблема:** Браузер становился белым, требовалась перезагрузка страницы.
**Причина:** Постоянные перерисовки из-за анимаций каруселей и тяжёлых компонентов.

### 2. Пропадающие части картинок
**Проблема:** Изображения загружались частично или не загружались вовсе.
**Причина:** Отсутствие ленивой загрузки и оптимизации изображений.

### 3. Высокая нагрузка на процессор
**Проблема:** Сайт тормозил на устройствах со слабой производительностью.
**Причина:** Множество одновременных операций и отсутствие мемоизации.

## Внесённые оптимизации

### Hero Carousel (`src/components/HeroCarousel.jsx`)

```javascript
// Увеличенный интервал переключения (8 секунд вместо 6)
const SLIDE_INTERVAL = 8000;

// Пауза анимации при потере видимости вкладки
const [isVisible, setIsVisible] = React.useState(() => {
  return document.visibilityState === "visible";
});

// Ленивая загрузка фоновых изображений
backgroundImage: i === active ? `url(${normalizeFilesUrl(s.image)})` : "none"
```

**Что сделано:**
- ✅ Увеличен интервал автопереключения с 6 до 8 секунд
- ✅ Добавлена пауза анимации при переключении вкладки
- ✅ Ленивая загрузка фоновых изображений слайдов
- ✅ Оптимизация CSS-свойств через `willChange`

### News Image Carousel (`src/components/NewsImageCarousel.jsx`)

```javascript
// Предзагрузка следующего и предыдущего изображений
React.useEffect(() => {
  const preloadImage = (url) => {
    if (!url || loadedImages.has(url)) return;
    const img = new Image();
    img.src = url;
    img.onload = () => setLoadedImages(prev => new Set(prev).add(url));
  };
  
  preloadImage(validImages[nextIndex]);
  preloadImage(validImages[prevIndex]);
}, [activeIndex, validImages, loadedImages]);

// Оптимизация рендеринга изображений
<img
  loading={index === 0 ? "eager" : "lazy"}
  decoding="async"
  fetchPriority={index === 0 ? "high" : "low"}
  style={{ contentVisibility: isActive ? "auto" : "hidden" }}
/>
```

**Что сделано:**
- ✅ Предзагрузка соседних изображений для плавного переключения
- ✅ Пауза автопереключения при потере видимости
- ✅ Lazy loading для неактивных изображений
- ✅ Async decoding для разгрузки основного потока
- ✅ `contentVisibility: hidden` для неактивных слайдов
- ✅ `fetchPriority` для приоритизации загрузки

### Vite конфигурация (`vite.config.js`)

```javascript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info'],
      passes: 2,
    },
  },
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'antd-vendor': ['antd', '@ant-design/icons'],
        'tinymce-vendor': ['@tinymce/tinymce-react', 'tinymce'],
      },
    },
  },
  target: 'es2020',
}
```

**Что сделано:**
- ✅ Code splitting для vendor библиотек
- ✅ Оптимизация Terser с дополнительными passes
- ✅ Разделение чанков по типам активов (CSS, изображения, шрифты)
- ✅ Target ES2020 для современных браузеров
- ✅ Оптимизация зависимостей через `optimizeDeps`

### HTML шаблон (`index.html`)

```html
<!-- Оптимизация производительности -->
<meta name="description" content="..." />
<meta name="theme-color" content="#003366" />

<!-- Предзагрузка критических ресурсов -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preconnect" href="https://khural.rtyva.ru" crossorigin />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://khural.rtyva.ru" />
```

**Что сделано:**
- ✅ Preconnect к критическим доменам
- ✅ DNS prefetch для ускорения разрешения имён
- ✅ Мета-теги для оптимизации загрузки

### Индикатор загрузки (`src/App.jsx`)

```javascript
// Простой CSS-спиннер без лишних зависимостей
<div
  style={{
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #003366",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  }}
/>
```

**Что сделано:**
- ✅ Лёгкий CSS-спиннер без JavaScript анимаций
- ✅ Визуальная обратная связь при загрузке данных

## Рекомендации для дальнейшей оптимизации

### 1. Ленивая загрузка страниц (React.lazy)

```javascript
const Deputies = React.lazy(() => import('./pages/DeputiesV2.jsx'));
const Documents = React.lazy(() => import('./pages/Documents.jsx'));
```

### 2. Виртуализация длинных списков

Для страниц со списками депутатов, документов использовать `react-window` или `react-virtualized`.

### 3. Оптимизация изображений на сервере

- Использовать формат WebP/AVIF
- Генерировать изображения разных размеров
- Использовать CDN для статики

### 4. Кэширование API запросов

```javascript
// Использовать React Query или SWR для кэширования
import { useQuery } from '@tanstack/react-query';
```

### 5. Разделение DataContext

Разделить глобальный контекст на несколько меньших:
- `NewsContext` - только новости
- `DeputiesContext` - только депутаты
- `DocumentsContext` - только документы

## Мониторинг производительности

### Lighthouse метрики

Проверяйте регулярно:
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **CLS** (Cumulative Layout Shift): < 0.1
- **TBT** (Total Blocking Time): < 200ms

### Команды для проверки

```bash
# Сборка production версии
npm run build

# Preview сборки
npm run preview

# Lighthouse CLI
npx lighthouse http://localhost:5173 --output=html --output-path=report.html
```

## Совместимость

Оптимизации протестированы и работают в:
- ✅ Chrome/Edge (современные версии)
- ✅ Firefox
- ✅ Safari
- ✅ Мобильные браузеры (iOS Safari, Chrome Mobile)

## Откат изменений

При необходимости отката:

```bash
git checkout HEAD -- src/components/HeroCarousel.jsx
git checkout HEAD -- src/components/NewsImageCarousel.jsx
git checkout HEAD -- src/App.jsx
git checkout HEAD -- vite.config.js
git checkout HEAD -- index.html
```

## Заключение

Внесённые оптимизации должны значительно улучшить производительность сайта на слабых устройствах:
- Меньше зависаний при прокрутке
- Плавные анимации
- Быстрая загрузка изображений
- Экономия батареи на мобильных устройствах

При возникновении проблем проверяйте консоль браузера на наличие ошибок и используйте Chrome DevTools Performance tab для анализа.
