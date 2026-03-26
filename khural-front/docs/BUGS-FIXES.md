# Разбор багов: консольные ошибки и производительность

## Ошибки в консоли (сводка)

| Ошибка | Где исправлять | Статус |
|--------|----------------|--------|
| `chrome-extension://invalid/` net::ERR_FAILED | Не в приложении — расширение браузера | Игнорировать |
| `someshit.yurta.site/settings/broadcast_links` 401 | Бэкенд: разрешить GET без auth | См. раздел ниже |
| CORS: `khural.yurta.site` → `someshit.yurta.site` | Бэкенд: настроить CORS | См. раздел ниже |
| `stats.vk-portal.net` 403 | Внешний скрипт / VK Portal | См. BUG-3 ниже |

---

## 401 Unauthorized на GET /settings/broadcast_links

### В чём ошибка

Запрос к `.../settings/broadcast_links` с фронта (страница «Трансляции») возвращает **401 Unauthorized**. Фронт вызывает `SettingsApi.getBroadcastLinksPublic()` с `auth: false` — список ссылок на архив трансляций должен быть доступен без входа.

### Что сделать

**На бэкенде (someshit.yurta.site):** разрешить **GET /settings/broadcast_links** без авторизации (публичный доступ). Либо завести отдельный публичный endpoint (например `GET /public/broadcast-links`), если не хотите открывать весь префикс `/settings/`.

Пока бэкенд не поправлен, в консоли будет «Failed to load resource: 401»; приложение при этом не падает — `tryApiFetch` возвращает `null`, страница трансляций работает без списка архивных ссылок.

---

## CORS и календарь (calendar)

### Было

Запросы к `someshit.yurta.site/calendar` с `https://khural.yurta.site` блокировались CORS: в preflight ответе сервера не было заголовка `Access-Control-Allow-Headers: cache-control`, хотя фронт отправлял `Cache-Control: no-cache`.

### Исправление (фронт)

В `src/api/client.js` у вызовов **EventsApi.list**, **getByMonth**, **getByYear** убраны заголовки `Cache-Control` и `Pragma`. Запрос к календарю стал «простым» (GET без кастомных заголовков), preflight не требует разрешения этих полей — CORS для calendar больше не должен падать.

Если позже понадобится кэширование — на бэкенде нужно добавить в CORS заголовок `Access-Control-Allow-Headers` значение `Cache-Control` (и при необходимости `Pragma`).

---

## CORS: доступ с khural.yurta.site к someshit.yurta.site

### В чём ошибка

Фронтенд размещён на `https://khural.yurta.site`, а бэкенд (API и файлы) — на `https://someshit.yurta.site`. Браузер блокирует запросы к API и файлам из-за CORS.

### Исправление (бэкенд)

**На бэкенде (someshit.yurta.site)** нужно добавить CORS заголовки для домена `https://khural.yurta.site`:

```javascript
// Node.js / Express пример
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://khural.yurta.site');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

Или для nginx:

```nginx
location / {
    add_header 'Access-Control-Allow-Origin' 'https://khural.yurta.site' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, PATCH, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' '*' always;
    add_header 'Access-Control-Allow-Credentials' 'true' always;
    
    if ($request_method = 'OPTIONS') {
        return 200;
    }
}
```

### Временное решение (для тестов)

Для `/files` endpoint можно разрешить все домены:

```javascript
app.use('/files', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

---

## chrome-extension://invalid/

Сообщение `Failed to load resource: net::ERR_FAILED` для `chrome-extension://invalid/` идёт **не от сайта**, а от расширения Chrome (например блокировщик рекламы, DevTools и т.п.). Исправлять в коде приложения не нужно, можно игнорировать.

---

## BUG-3: 403 Forbidden на https://stats.vk-portal.net/

### В чём ошибка

Запрос к `https://stats.vk-portal.net/` завершается с **403 Forbidden** (в консоли — `net::ERR_ABORTED`, в логах может фигурировать скрипт вида `error_monitoring...js`).

### Где искать причину

В **этом репозитории** скриптов на `stats.vk-portal.net` и `error_monitoring` нет. Значит, мониторинг подключается снаружи:

- при встраивании сайта в **VK Portal** (портал подгружает свой скрипт мониторинга);
- или на уровне хостинга/прокси (инъекция скрипта в HTML).

То есть 403 возникает на стороне **сервиса stats.vk-portal.net**: домен/реферер/ключ не в allowlist или блокируются политиками/фаерволом.

### Что сделать

1. **На стороне VK Portal / владельца stats:**
   - Проверить allowlist рефереров и доменов (например, `khural.rtyva.ru`, домен стенда).
   - При необходимости добавить туда домен, с которого реально открывается сайт.

2. **На stage/dev:**
   - Либо не подключать скрипт мониторинга (настраивается там, где его инжектят — портал/хостинг).
   - Либо использовать тестовый endpoint, если у сервиса есть отдельный URL для теста.

3. **Если скрипт позже добавят в этот проект** (например, в `index.html`):
   - Подключать его только когда мониторинг разрешён (например, по env или по домену).
   - Пример условной загрузки см. в комментарии в `index.html` (блок про stats/monitoring).

Итог: **исправить 403 можно только на стороне stats.vk-portal.net или отключив/условно подключая мониторинг там, где он внедряется.**

---

## BUG-4: Non-passive event listener (scroll-blocking)

### В чём ошибка

В DevTools в консоли появляется предупреждение вида:

```text
[Violation] Added non-passive event listener to a scroll-blocking <some> event. Consider marking event handler as 'passive'...
```

Оно касается событий, блокирующих скролл: `touchstart`, `touchmove`, `wheel`, иногда `mousewheel`.

### Где искать причину в нашем коде

- В приложении **единственный** подписка на scroll — в `ScrollToTop.jsx`, и там уже используется **`{ passive: true }`**.
- Остальные `addEventListener` в проекте — на `click`, `popstate`, `resize`, `storage`, `visibilitychange` и т.п. Они не считаются scroll-blocking, для них passive не обязателен. В `Router.jsx` обработчик `click` вызывает `preventDefault()` — для него **нельзя** ставить `passive: true`.

Вывод: **источник предупреждения не наш код**, а одна из сторонних зависимостей.

### Наиболее вероятные источники

1. **lidrekon.ru** — скрипты для слабовидящих (`jquery.js`, `uhpv-full.min.js` в `index.html`). Такие плагины часто вешают обработчики touch без `passive`.
2. **Виджет Госуслуг** — `gos_pos_cit.js` тянет `https://pos.gosuslugi.ru/bin/script.min.js`, который может регистрировать touch/wheel.
3. **Ant Design (antd)** — компоненты вроде Slider, Modal, Drawer могут использовать touch-обработчики внутри библиотеки.

### Что сделать

1. **Ничего не менять в обработчиках, где вызывается `preventDefault()`** — там passive ставить нельзя.
2. **Для своих обработчиков** touch/wheel/scroll: если `preventDefault()` не нужен — добавлять третьим аргументом `{ passive: true }`.
3. **Сторонний код** (lidrekon, gosuslugi, antd) мы не правим. Варианты:
   - Оставить как есть (предупреждение не ломает работу).
   - Загружать lidrekon только при `special_version=Y` (уже так сделано в `index.html`), чтобы в обычном режиме лишние обработчики не вешались.
   - При необходимости — запросить у поставщиков скриптов версии с passive-обработчиками или отключить ненужные виджеты на stage.

Итог: **в нашем коде менять нечего; предупреждение идёт от сторонних скриптов; при добавлении новых scroll-blocking обработчиков использовать `{ passive: true }`, если не нужен `preventDefault()`.**
