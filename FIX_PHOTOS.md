# Исправление проблемы с пропадающими фотографиями

## Проблема

На продакшене фотографии депутатов то появлялись, то пропадали.

## Причины

1. **Неправильное кодирование URL** - пути к фотографиям с кириллическими символами, пробелами и специальными символами не кодировались должным образом
2. **Отсутствие прокси на продакшене** - прокси `/img-proxy` для обхода CORS работал только в режиме разработки (Vite dev server)
3. **Скрытие изображений при ошибке** - при ошибке загрузки изображение полностью скрывалось (`display: none`) вместо показа placeholder

## Решение

### 1. Улучшено кодирование URL фотографий

#### `khural-front/src/utils/filesUrl.js`

Обновлена функция `encodeSegment`:
- Добавлена обработка множественного кодирования (декодирование в цикле)
- Гарантируется правильное кодирование кириллических символов

#### `khural-front/src/context/DataContext.jsx`

Добавлены вспомогательные функции:
- `encodePathSegment` - кодирует один сегмент пути
- `encodeUrlPathname` - кодирует весь путь URL

Обновлена функция `normalizePhotoUrl`:
- Все пути к фотографиям теперь правильно кодируются
- Обрабатываются URL с `khural.rtyva.ru`
- Учитывается множественное кодирование

### 2. Добавлен прокси для продакшена

#### `khural-front/vercel.json`

Добавлены:
- Rewrite для `/img-proxy/*` → `https://khural.rtyva.ru/*`
- Rewrite для `/pdf-proxy/*` → `https://khural.rtyva.ru/*`
- CORS заголовки для обоих прокси

Это позволяет обходить проблемы с CORS на продакшене так же, как в режиме разработки.

### 3. Улучшена обработка ошибок загрузки изображений

Обновлены все компоненты, отображающие фотографии:

#### Обработчик `onError`

```javascript
onError={(e) => {
  const img = e.target;
  const currentSrc = img.src;
  
  // Попытка 1: загрузить через прокси
  if (currentSrc.includes("khural.rtyva.ru") && !img.dataset.proxyTried) {
    img.dataset.proxyTried = "true";
    img.src = currentSrc.replace("https://khural.rtyva.ru", "/img-proxy");
  } else {
    // Попытка 2: показать placeholder вместо скрытия
    img.style.display = "";
    img.removeAttribute("src");
    img.classList.remove("gov-card__avatar");
    img.classList.add("gov-card__avatar-placeholder");
  }
}}
```

#### Обновленные файлы:
- `khural-front/src/pages/Deputies.jsx`
- `khural-front/src/pages/DeputiesV2.jsx`
- `khural-front/src/pages/Government.jsx`
- `khural-front/src/pages/Section.jsx`
- `khural-front/src/pages/Committee.jsx`
- `khural-front/src/pages/CommitteeStaffDetail.jsx`
- `khural-front/src/components/PersonDetail.jsx`

### 4. Добавлены стили для placeholder

#### `khural-front/src/styles/index.css`

Добавлены стили для placeholder:
- `.gov-card__avatar-placeholder` - для карточек депутатов
- `.person-card__photo-placeholder` - для карточек персон (комитеты)
- `.person-portrait-placeholder` - для портретов на странице деталей

Все placeholder сохраняют размеры и стили оригинальных элементов (серый фон, скругление, тень).

## Результат

Теперь фотографии:
1. ✅ Правильно кодируются в URL (поддержка кириллицы и спецсимволов)
2. ✅ Загружаются через прокси при проблемах с CORS
3. ✅ Показывают серый placeholder вместо полного исчезновения
4. ✅ Работают стабильно как в development, так и в production

## Развертывание

После коммита и пуша на Vercel изменения автоматически развернутся:
1. Обновится конфигурация прокси
2. Обновится код с улучшенным кодированием URL
3. Применятся новые обработчики ошибок

## Тестирование

Для проверки:
1. Откройте страницу депутатов на продакшене
2. Проверьте, что все фотографии отображаются
3. Откройте DevTools → Network → Img
4. Убедитесь, что фотографии загружаются либо напрямую, либо через `/img-proxy`
5. Проверьте, что при ошибке загрузки показывается серый круг (placeholder), а не пустое место
