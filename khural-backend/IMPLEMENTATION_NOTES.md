# Заметки по реализации новых модулей

## Установка дополнительных зависимостей

Для полной функциональности необходимо установить следующие пакеты:

```bash
# Для двухфакторной аутентификации (2FA)
npm install speakeasy qrcode @types/speakeasy @types/qrcode

# Для rate limiting (защита от DDoS)
npm install @nestjs/throttler

# Для планировщика задач (автоматические бэкапы)
npm install @nestjs/schedule
```

## После установки зависимостей

### 1. Активировать 2FA

Раскомментировать код в файле `src/auth/2fa/2fa.service.ts`:
- Импорты `speakeasy` и `qrcode`
- Все методы, использующие эти библиотеки

### 2. Активировать Rate Limiting

В файле `src/main.ts` раскомментировать:
```typescript
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
// ...
app.useGlobalGuards(new ThrottlerGuard());
```

Также добавить в `app.module.ts`:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 минута
      limit: 10, // 10 запросов
    }]),
    // ...
  ],
})
```

### 3. Активировать планировщик бэкапов

В файле `src/backup/backup.module.ts` раскомментировать:
```typescript
import { ScheduleModule } from '@nestjs/schedule';
// ...
ScheduleModule.forRoot(),
```

В файле `src/backup/backup-scheduler.service.ts` раскомментировать:
```typescript
import { Cron, CronExpression } from '@nestjs/schedule';
// ...
@Cron(process.env.BACKUP_CRON || CronExpression.EVERY_DAY_AT_2AM)
```

## Переменные окружения

Добавьте в `.env`:

```env
# Автоматический экспорт новостей в соцсети
AUTO_EXPORT_NEWS=true

# Настройки ВКонтакте
VK_ACCESS_TOKEN=your_vk_token
VK_GROUP_ID=your_group_id

# Настройки Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Автоматические бэкапы
AUTO_BACKUP_ENABLED=true
BACKUP_CRON=0 2 * * *  # Каждый день в 2:00 (cron формат)
BACKUP_DIR=./backups

# CDN для файлов
CDN=http://your-cdn-url

# Frontend URL для ссылок в соцсетях
FRONTEND_URL=https://your-frontend-url
```

## Новые модули

Все модули реализованы и готовы к использованию:
- ✅ DocumentsModule - управление документами
- ✅ CalendarModule - календарь мероприятий
- ✅ SliderModule - слайдер главной страницы
- ✅ AppealsModule - обращения граждан
- ✅ CommentsModule - система комментариев
- ✅ LocalizationModule - многоязычность
- ✅ TranslationModule - машинный перевод (заглушка)
- ✅ SearchModule - поиск по сайту
- ✅ SocialExportModule - экспорт в соцсети
- ✅ AboutModule - страницы "О Хурале"
- ✅ BackupModule - резервное копирование
- ✅ AccessibilityModule - настройки доступности
- ✅ EsiaModule - интеграция с ЕСИА (заглушка)
- ✅ TwoFAModule - двухфакторная аутентификация

## API Endpoints

Все endpoints документированы в Swagger: `http://localhost:4000/api`

