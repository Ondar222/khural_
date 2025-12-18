import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BackupRecordEntity } from './entities/backup-record.entity';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(BackupRecordEntity)
    private readonly backupRepository: Repository<BackupRecordEntity>,
    private readonly configService: ConfigService,
  ) {}

  async createBackup(): Promise<BackupRecordEntity> {
    const dbHost = this.configService.get<string>('DB_HOST');
    const dbPort = this.configService.get<number>('DB_PORT');
    const dbUser = this.configService.get<string>('DB_USER');
    const dbName = this.configService.get<string>('DB_NAME');
    const backupDir = this.configService.get<string>('BACKUP_DIR') || './backups';

    // Создаем директорию для бэкапов, если её нет
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // Формируем команду pg_dump
    const pgDumpCmd = `PGPASSWORD="${this.configService.get<string>('DB_PASSWORD')}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${filepath}`;

    try {
      await execAsync(pgDumpCmd);
      
      const stats = fs.statSync(filepath);
      const filesize = stats.size;

      const backup = this.backupRepository.create({
        filename,
        filepath,
        filesize,
      });

      return this.backupRepository.save(backup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Backup failed: ${message}`);
    }
  }

  async restoreBackup(backupId: number): Promise<void> {
    const backup = await this.backupRepository.findOne({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error(`Backup with ID ${backupId} not found`);
    }

    const dbHost = this.configService.get<string>('DB_HOST');
    const dbPort = this.configService.get<number>('DB_PORT');
    const dbUser = this.configService.get<string>('DB_USER');
    const dbName = this.configService.get<string>('DB_NAME');

    const pgRestoreCmd = `PGPASSWORD="${this.configService.get<string>('DB_PASSWORD')}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -c ${backup.filepath}`;

    try {
      await execAsync(pgRestoreCmd);
      backup.isRestored = true;
      await this.backupRepository.save(backup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Restore failed: ${message}`);
    }
  }

  async getAllBackups(): Promise<BackupRecordEntity[]> {
    return this.backupRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async deleteBackup(backupId: number): Promise<void> {
    const backup = await this.backupRepository.findOne({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error(`Backup with ID ${backupId} not found`);
    }

    // Удаляем файл
    if (fs.existsSync(backup.filepath)) {
      fs.unlinkSync(backup.filepath);
    }

    await this.backupRepository.remove(backup);
  }
}

