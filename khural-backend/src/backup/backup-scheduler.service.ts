import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackupService } from './backup.service';
// TODO: Установить @nestjs/schedule для планировщика
// import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class BackupSchedulerService implements OnModuleInit {
  constructor(
    private readonly backupService: BackupService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const autoBackupEnabled = this.configService.get<string>('AUTO_BACKUP_ENABLED') === 'true';
    if (autoBackupEnabled) {
      console.log('Автоматическое резервное копирование включено');
    }
  }

  /**
   * Автоматическое резервное копирование каждый день в 2:00 ночи
   * Можно настроить через переменную окружения BACKUP_CRON
   * TODO: Раскомментировать после установки @nestjs/schedule
   */
  // @Cron(process.env.BACKUP_CRON || CronExpression.EVERY_DAY_AT_2AM)
  async handleBackup() {
    const autoBackupEnabled = this.configService.get<string>('AUTO_BACKUP_ENABLED') === 'true';
    
    if (!autoBackupEnabled) {
      return;
    }

    try {
      console.log('Запуск автоматического резервного копирования...');
      const backup = await this.backupService.createBackup();
      console.log(`Резервная копия создана: ${backup.filename} (${backup.filesize} bytes)`);
    } catch (error) {
      console.error('Ошибка при создании автоматической резервной копии:', error);
    }
  }
}

