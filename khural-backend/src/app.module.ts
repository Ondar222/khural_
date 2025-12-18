import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { TwoFAModule } from './auth/2fa/2fa.module';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { SessionModule } from './session/session.module';

import { FilesModule } from './files/files.module';
import { NewsModule } from './news/news.module';
import { PersonsModule } from './persons/persons.module';
import { DocumentsModule } from './documents/documents.module';
import { CalendarModule } from './calendar/calendar.module';
import { SliderModule } from './slider/slider.module';

import { AppealsModule } from './appeals/appeals.module';
import { CommentsModule } from './comments/comments.module';
import { SearchModule } from './search/search.module';
import { TranslationModule } from './translation/translation.module';
import { LocalizationModule } from './localization/localization.module';
import { AccessibilityModule } from './accessibility/accessibility.module';
import { AboutModule } from './about/about.module';
import { BackupModule } from './backup/backup.module';
import { SocialExportModule } from './social-export/social-export.module';
import { EsiaModule } from './esia/esia.module';
import { ContactModule } from './contact/contact.module';
import { LoggerModule } from './logger/logger.module';
import { NotificationModule } from './notification/notification.module';
import { EmailModule } from './email/email.module';
import { DocsModule } from './docs/docs.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Local dev frequently has stale .env values; prefer process env + code defaults.
      // To force reading ".env" set USE_ENV_FILE=true in your environment.
      ignoreEnvFile: process.env.USE_ENV_FILE !== 'true',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') || '127.0.0.1',
        port: Number(config.get<number>('DB_PORT') || 5432),
        username: config.get<string>('DB_USER') || 'postgres',
        password: config.get<string>('DB_PASSWORD') || 'postgres',
        database: config.get<string>('DB_NAME') || 'khural',
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    TwoFAModule,
    UserModule,
    RoleModule,
    SessionModule,

    FilesModule,
    NewsModule,
    PersonsModule,
    DocumentsModule,
    CalendarModule,
    SliderModule,

    AppealsModule,
    CommentsModule,
    SearchModule,
    TranslationModule,
    LocalizationModule,
    AccessibilityModule,
    AboutModule,
    BackupModule,
    SocialExportModule,
    EsiaModule,
    ContactModule,
    LoggerModule,
    NotificationModule,
    EmailModule,
    DocsModule,
  ],
})
export class AppModule {}
