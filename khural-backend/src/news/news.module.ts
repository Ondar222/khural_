import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsService } from "./news.service";
import { NewsController } from "./news.controller";
import { NewsRepository } from "./news.repository";
import { FilesModule } from '../files/files.module';
import { NewsEntity } from './entities/news.entity';
import { NewsCategory } from './entities/news-category.entity';
import { SocialExportModule } from '../social-export/social-export.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsEntity, NewsCategory]),
    FilesModule,
    SocialExportModule, // Для автоматического экспорта
  ],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository],
  exports: [NewsService, NewsRepository],
})
export class NewsModule {}
