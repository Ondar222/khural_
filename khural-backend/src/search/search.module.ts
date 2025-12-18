import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { NewsEntity } from '../news/entities/news.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { PersonEntity } from '../persons/entities/person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsEntity, DocumentEntity, PersonEntity]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

