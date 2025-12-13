import { Module } from "@nestjs/common";
import { NewsService } from "./news.service";
import { NewsController } from "./news.controller";
import { NewsRepository } from "./news.repository";
import { FilesModule } from '../files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [NewsController],
  providers: [NewsService, NewsRepository],
  exports: [NewsService, NewsRepository],
})
export class NewsModule {}
