import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// TODO: Установить @nestjs/schedule для планировщика
// import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { BackupSchedulerService } from './backup-scheduler.service';
import { BackupRecordEntity } from './entities/backup-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([BackupRecordEntity]),
    // ScheduleModule.forRoot(), // Раскомментировать после установки @nestjs/schedule
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupSchedulerService],
  exports: [BackupService],
})
export class BackupModule {}

