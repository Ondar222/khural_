import { Module, forwardRef } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NewsModule } from './news/news.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsEntity } from './news/entities/news.entity';
import { Files } from './files/files.entity';
import { FilesModule } from './files/files.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './user/entity/user.entity';
import { Role } from './role/role.entity';
import { NewsContentEntity } from './news/entities/news-content.entity';
import { User } from './auth/entities/user.entity';
import { Category } from './persons/entities/category.entity';
import { PersonEntity } from './persons/entities/person.entity';
import { PersonsModule } from './persons/persons.module';
import { DocumentsModule } from './documents/documents.module';
import { DocumentEntity } from './documents/entities/document.entity';
import { EventsModule } from './events/events.module';
import { EventEntity } from './events/entities/event.entity';
import { SeedModule } from './seed/seed.module';


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
        type: "postgres",

        host: config.get<string>('DB_HOST') || "127.0.0.1",
        port: Number(config.get<number>('DB_PORT') || 5432),
        username: config.get<string>('DB_USER') || "postgres",
        password: config.get<string>('DB_PASSWORD') || "postgres",
        database: config.get<string>('DB_NAME') || "khural",

        entities: [
          NewsEntity,
          NewsContentEntity,
          Files,
          UserEntity,
          Role,
          PersonEntity,
          Category,
          DocumentEntity,
          EventEntity,
          User
        ],
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    NewsModule,
    FilesModule,
    UserModule,
    AuthModule,
    PersonsModule,
    DocumentsModule,
    EventsModule,
    SeedModule,



  ],
})
export class AppModule {}
