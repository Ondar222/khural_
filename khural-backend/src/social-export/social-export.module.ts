import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SocialExportController } from './social-export.controller';
import { SocialExportService } from './social-export.service';
import { VkProvider } from './providers/vk.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { SocialExportLogEntity } from './entities/social-export-log.entity';
import { NewsEntity } from '../news/entities/news.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SocialExportLogEntity, NewsEntity]),
    HttpModule,
  ],
  controllers: [SocialExportController],
  providers: [SocialExportService, VkProvider, TelegramProvider],
  exports: [SocialExportService],
})
export class SocialExportModule {}

