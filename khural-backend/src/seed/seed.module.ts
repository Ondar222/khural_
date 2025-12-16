import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsEntity } from "../news/entities/news.entity";
import { PersonEntity } from "../persons/entities/person.entity";
import { DocumentEntity } from "../documents/entities/document.entity";
import { EventEntity } from "../events/entities/event.entity";
import { SeedService } from "./seed.service";

@Module({
  imports: [TypeOrmModule.forFeature([NewsEntity, PersonEntity, DocumentEntity, EventEntity])],
  providers: [SeedService],
})
export class SeedModule {}



