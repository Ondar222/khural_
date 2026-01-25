# Спецификация API для депутатов

## Формат данных депутата

Для корректного отображения всех данных депутата в карточке необходимы следующие поля:

### Обязательные поля

```json
{
  "id": "string",                    // Уникальный идентификатор (ОБЯЗАТЕЛЬНО)
  "name": "string",                  // ФИО депутата (ОБЯЗАТЕЛЬНО)
  "photo": "string"                  // URL фотографии (можно пустую строку)
}
```

### Основная информация

```json
{
  "position": "string",              // Должность депутата
  "role": "string",                  // Роль (альтернатива position)
  "district": "string",              // Избирательный округ
  "faction": "string",               // Фракция (партия)
  "convocation": "string",           // Созыв (например: "IV", "VII")
  "convocationNumber": "string",     // Номер созыва (альтернатива)
  "convocations": [                  // Массив созывов (если депутат в нескольких)
    {
      "name": "string",              // Название созыва
      "title": "string"              // Альтернатива name
    }
  ]
}
```

### Биография

```json
{
  "biography": "string",             // Полная биография (HTML поддерживается)
  "bio": "string",                   // Краткая биография (альтернатива)
  "description": "string"            // Описание (альтернатива)
}
```

### Контакты

```json
{
  "contacts": {                      // Объект контактов (РЕКОМЕНДУЕТСЯ)
    "phone": "string",               // Телефон
    "email": "string"                // Email
  },
  "phone": "string",                 // Телефон (альтернатива, если без contacts)
  "email": "string",                 // Email (альтернатива)
  "address": "string"                // Адрес приемной
}
```

### Комитеты

```json
{
  "committeeIds": ["string"],        // Массив ID комитетов (РЕКОМЕНДУЕТСЯ)
  "committees": [                    // Массив объектов комитетов (альтернатива)
    {
      "id": "string",
      "name": "string",
      "title": "string"
    }
  ]
}
```

### Законодательная деятельность

```json
{
  "legislativeActivity": [           // Массив законов из API (ПРИОРИТЕТ)
    {
      "id": "string",
      "title": "string",             // Название закона
      "number": "string",            // Номер закона
      "status": "string",            // Статус (например: "Принят", "На рассмотрении")
      "document": "string",          // URL документа (PDF)
      "url": "string"                // URL документа (альтернатива)
    }
  ],
  "laws": [                          // Альтернативный массив (если API не вернул)
    // Та же структура
  ]
}
```

### Сведения о доходах

```json
{
  "incomeDeclarations": [            // Массив деклараций из API (ПРИОРИТЕТ)
    {
      "year": 2024,                  // Год декларации
      "title": "string",             // Название документа
      "size": "string",              // Размер файла (например: "122.9 kB")
      "document": "string",          // URL документа (PDF)
      "url": "string"                // URL документа (альтернатива)
    }
  ],
  "incomeDocs": [                    // Альтернативный массив (если API не вернул)
    // Та же структура
  ]
}
```

### График приема граждан

```json
{
  "receptionSchedule": {             // Объект графика из API (ПРИОРИТЕТ)
    "workingDays": [                 // Массив рабочих дней
      {
        "dayOfWeek": "monday",       // День недели
        "isWorking": true,           // Рабочий ли день
        "startTime": "10:00",        // Время начала
        "endTime": "12:00"           // Время окончания
      }
    ],
    "notes": "string"                // Дополнительные примечания (HTML)
  },
  "reception": "string",             // Текстовое описание (альтернатива)
  "schedule": [                      // Массив расписания (альтернатива)
    {
      "day": "Понедельник",
      "time": "10:00 - 12:00"
    }
  ]
}
```

## Полный пример JSON депутата

```json
{
  "id": "dep-123",
  "name": "Иванов Иван Иванович",
  "photo": "https://khural.rtyva.ru/upload/iblock/abc/photo.jpg",
  "position": "Депутат Верховного Хурала",
  "district": "Кызылский избирательный округ №5",
  "faction": "Единая Россия",
  "convocation": "VII",
  "biography": "<p>Родился 1 января 1970 года...</p>",
  "contacts": {
    "phone": "+7 (39422) 12-34-56",
    "email": "ivanov@khural.org"
  },
  "address": "г. Кызыл, ул. Ленина, д. 32, кабинет 206",
  "committeeIds": ["agro", "econ"],
  "legislativeActivity": [
    {
      "id": "law-1",
      "title": "О внесении изменений в закон...",
      "number": "№ 123-VII",
      "status": "Принят",
      "document": "https://khural.rtyva.ru/upload/docs/law-123.pdf"
    }
  ],
  "incomeDeclarations": [
    {
      "year": 2024,
      "title": "Декларация за 2024 год",
      "size": "256 kB",
      "document": "https://khural.rtyva.ru/upload/income/2024.pdf"
    }
  ],
  "receptionSchedule": {
    "workingDays": [
      {
        "dayOfWeek": "monday",
        "isWorking": true,
        "startTime": "10:00",
        "endTime": "12:00"
      },
      {
        "dayOfWeek": "wednesday",
        "isWorking": true,
        "startTime": "15:00",
        "endTime": "17:00"
      }
    ],
    "notes": "Запись по телефону"
  }
}
```

## Приоритет полей

Если бэкенд возвращает несколько версий одного поля, фронтенд использует их в следующем порядке:

### Фото
1. `photo`
2. `image.link`
3. `image.url`
4. `photoUrl`
5. `photo_url`

### Биография
1. `biography`
2. `bio`
3. `description`
4. `position`
5. `role`

### Телефон
1. `contacts.phone`
2. `phone`

### Email
1. `contacts.email`
2. `email`

### Законы
1. `legislativeActivity[]` (из API)
2. `laws[]` (локальные данные)

### Доходы
1. `incomeDeclarations[]` (из API)
2. `incomeDocs[]` (локальные данные)

### График приема
1. `receptionSchedule.workingDays[]` (из API)
2. `receptionSchedule` (строка)
3. `reception` (строка)
4. `schedule[]` (массив)

## Важные замечания

### 1. Обработка HTML
- Поля `biography`, `bio`, `description` могут содержать HTML
- Фронтенд автоматически декодирует HTML entities (например: `&lt;` → `<`)
- Поддерживаются теги: `<p>`, `<br>`, `<b>`, `<i>`, `<ul>`, `<ol>`, `<li>`

### 2. URL фотографий
- Если URL начинается с `/upload/`, автоматически добавляется `https://khural.rtyva.ru`
- Поддерживаются: полные URL, относительные пути, data URLs, blob URLs

### 3. Созывы
- Можно указать один созыв: `"convocation": "VII"`
- Или массив созывов: `"convocations": [{"name": "VII"}, {"name": "VI"}]`
- Фронтенд отобразит все созывы через запятую

### 4. Комитеты
- Лучше использовать `committeeIds[]` с ID комитетов
- Фронтенд автоматически найдет полные данные комитетов по ID
- Можно также передать полные объекты в `committees[]`

### 5. График приема
- Если в `receptionSchedule.notes` длина текста > 200 символов ИЛИ текст содержит биографические слова (родился, окончил, работал), фронтенд **не покажет** это в графике приема (защита от ошибок)
- Рекомендуется использовать структурированный формат `workingDays[]`

## Импорт через админку

При импорте депутатов через админку (JSON файл):
1. Все поля должны быть в формате, указанном выше
2. Минимальный набор: `id`, `name`, `photo` (можно пустое)
3. Рекомендуемый набор: добавить `position`, `contacts`, `district`, `faction`, `convocation`
4. Полный набор: включить все поля из примера выше

## Пример минимального депутата для импорта

```json
{
  "id": "dep-new-1",
  "name": "Новый Депутат Тестович",
  "photo": "",
  "position": "Депутат Верховного Хурала",
  "contacts": {
    "phone": "",
    "email": ""
  }
}
```

Этого достаточно для создания карточки депутата, остальные поля можно заполнить позже.
