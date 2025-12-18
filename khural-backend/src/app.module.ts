import { Module } from '@nestjs/common';

import { NewsModule } from './news/news.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsEntity } from './news/entities/news.entity';
import { Files } from './files/files.entity';
import { FilesModule } from './files/files.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { Role } from './role/role.entity';
import { NewsContentEntity } from './news/entities/news-content.entity';
import { User } from './user/user.entity';
import { Category } from './persons/entities/category.entity';
import { PersonEntity } from './persons/entities/person.entity';
import { DeclarationEntity } from './persons/entities/declaration.entity';
import { PersonsModule } from './persons/persons.module';

// Новые модули
import { DocumentsModule } from './documents/documents.module';
import { DocumentEntity } from './documents/entities/document.entity';
import { DocumentCategoryEntity } from './documents/entities/document-category.entity';
import { CalendarModule } from './calendar/calendar.module';
import { EventEntity } from './calendar/entities/event.entity';
import { EventTypeEntity } from './calendar/entities/event-type.entity';
import { SliderModule } from './slider/slider.module';
import { SliderItemEntity } from './slider/entities/slider-item.entity';
import { AppealsModule } from './appeals/appeals.module';
import { AppealEntity } from './appeals/entities/appeal.entity';
import { AppealStatusEntity } from './appeals/entities/appeal-status.entity';
import { AppealHistoryEntity } from './appeals/entities/appeal-history.entity';
import { CommentsModule } from './comments/comments.module';
import { CommentEntity } from './comments/entities/comment.entity';
import { LocalizationModule } from './localization/localization.module';
import { TranslationModule } from './translation/translation.module';
import { SearchModule } from './search/search.module';
import { SocialExportModule } from './social-export/social-export.module';
import { SocialExportLogEntity } from './social-export/entities/social-export-log.entity';
import { AboutModule } from './about/about.module';
import { PageEntity } from './about/entities/page.entity';
import { StructureItemEntity } from './about/entities/structure-item.entity';
import { BackupModule } from './backup/backup.module';
import { BackupRecordEntity } from './backup/entities/backup-record.entity';
import { AccessibilityModule } from './accessibility/accessibility.module';
import { UserAccessibilitySettingsEntity } from './accessibility/entities/user-accessibility-settings.entity';
import { EsiaModule } from './esia/esia.module';
import { TwoFAModule } from './auth/2fa/2fa.module';
import { User2FAEntity } from './auth/2fa/entities/user-2fa.entity';
import { DocumentContentEntity } from './documents/entities/document-content.entity';
import { EventContentEntity } from './calendar/entities/event-content.entity';
import { SliderItemContentEntity } from './slider/entities/slider-item-content.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        type: "postgres",

        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),

        entities: [
          NewsEntity,
          NewsContentEntity,
          Files,
          User,
          Role,
          PersonEntity,
          Category,
          DeclarationEntity,
          // Новые сущности
          DocumentEntity,
          DocumentCategoryEntity,
          EventEntity,
          EventTypeEntity,
          SliderItemEntity,
          AppealEntity,
          AppealStatusEntity,
          AppealHistoryEntity,
          CommentEntity,
          SocialExportLogEntity,
          PageEntity,
          StructureItemEntity,
          BackupRecordEntity,
          UserAccessibilitySettingsEntity,
          User2FAEntity,
          // Сущности локализации
          DocumentContentEntity,
          EventContentEntity,
          SliderItemContentEntity,
        ],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    // Существующие модули
    NewsModule,
    FilesModule,
    UserModule,
    AuthModule,
    PersonsModule,
    // Новые модули
    DocumentsModule,
    CalendarModule,
    SliderModule,
    AppealsModule,
    CommentsModule,
    LocalizationModule,
    TranslationModule,
    SearchModule,
    SocialExportModule,
    AboutModule,
    BackupModule,
    AccessibilityModule,
    EsiaModule,
    TwoFAModule,
  ],
})
export class AppModule {}
